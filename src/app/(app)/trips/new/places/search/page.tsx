"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bike,
  Coffee,
  Hotel,
  Landmark,
  MapPin,
  Palette,
  ShoppingBag,
  Trash2,
  Trees,
  Utensils,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { renderToStaticMarkup } from "react-dom/server";
import type { DistrictSelection } from "@/components/map/BusanDistrictPicker";
import MapTiler3D, { type MapTiler3DMarker } from "@/components/map/MapTiler3D";
import MapViewToggle, { type MapView } from "@/components/map/MapViewToggle";
import NaverMap from "@/components/map/NaverMap";
import PageFade from "@/components/ui/PageFade";
import searchIcon from "@/assets/icons/search.png";
import { resolvePlace, searchPlaces } from "@/lib/api/places";
import { placeCategoryLabel } from "@/utils/place-category";
import { searchPlacesGeo } from "@/lib/api/places";
import { useTripDraft } from "@/store/trip-draft";
import type { PlaceSearchItem, PlaceSummary, PlaceSource } from "@/types/api/place";

const BusanDistrictPicker = dynamic(
  () => import("@/components/map/BusanDistrictPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
        지역 지도를 불러오는 중...
      </div>
    ),
  },
);

function selectionKey(place: PlaceSearchItem) {
  return place.placeId !== null
    ? `place:${place.placeId}`
    : `${place.source}:${place.externalId}`;
}

function isSamePlace(left: PlaceSearchItem, right: PlaceSearchItem) {
  if (left.placeId !== null && right.placeId !== null)
    return left.placeId === right.placeId;
  return left.source === right.source && left.externalId === right.externalId;
}

function tripDays(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 1;
  return (
    Math.round(
      (new Date(`${endDate}T00:00:00Z`).getTime() -
        new Date(`${startDate}T00:00:00Z`).getTime()) /
        86400000,
    ) + 1
  );
}

function summaryToSearchItem(p: PlaceSummary): PlaceSearchItem {
  return {
    name: p.name,
    address: p.address,
    longitude: p.longitude,
    latitude: p.latitude,
    placeId: p.placeId,
    source: p.source as PlaceSource,
    externalId: p.externalId,
    category: p.category ?? "",
    categoryLabel: p.categoryLabel ?? "",
    primaryImageUrl: p.primaryImageUrl,
    placeUrl: p.placeUrl,
    resolved: p.resolved,
  };
}

const CATEGORY_ICON_COMPONENTS = {
  food: Utensils,
  cafe: Coffee,
  lodging: Hotel,
  shopping: ShoppingBag,
  leisure: Bike,
  culture: Palette,
  history: Landmark,
  nature: Trees,
  default: MapPin,
} as const;

type CategoryKey = keyof typeof CATEGORY_ICON_COMPONENTS;

function categoryKey(label: string | null): CategoryKey {
  if (!label) return "default";
  if (label.includes("음식") || label.includes("맛집")) return "food";
  if (label.includes("카페") || label.includes("디저트")) return "cafe";
  if (label.includes("숙박") || label.includes("호텔") || label.includes("펜션"))
    return "lodging";
  if (label.includes("쇼핑") || label.includes("시장")) return "shopping";
  if (label.includes("레포츠") || label.includes("체험") || label.includes("액티"))
    return "leisure";
  if (label.includes("문화") || label.includes("공연") || label.includes("전시"))
    return "culture";
  if (label.includes("역사") || label.includes("유적") || label.includes("종교"))
    return "history";
  if (
    label.includes("자연") ||
    label.includes("공원") ||
    label.includes("해수욕") ||
    label.includes("산")
  )
    return "nature";
  return "default";
}

function PlaceThumbnail({ place }: { place: PlaceSearchItem }) {
  if (!place.primaryImageUrl) {
    return (
      <div className="size-10 shrink-0 rounded-lg bg-linear-to-br from-[#2E7DF2] to-[#17B89B]" />
    );
  }
  return (
    <img
      src={place.primaryImageUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={(e) => e.currentTarget.remove()}
      className="size-10 shrink-0 rounded-lg object-cover"
    />
  );
}

export default function AiPlacesSearchPage() {
  const router = useRouter();
  const { draft, updateDraft } = useTripDraft();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<PlaceSearchItem[]>(draft.selectedPlaces);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [activePlace, setActivePlace] = useState<PlaceSearchItem | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [mapView, setMapView] = useState<MapView>("2d");
  const [mode, setMode] = useState<"search" | "region">("search");
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictSelection | null>(null);
  const [showRegionMap, setShowRegionMap] = useState(false);
  const [regionPlaces, setRegionPlaces] = useState<PlaceSummary[]>([]);
  const [regionLoading, setRegionLoading] = useState(false);
  const [regionActiveOrder, setRegionActiveOrder] = useState<number | null>(null);
  const [region3DActiveId, setRegion3DActiveId] = useState<number | null>(null);
  const [categoryIcons, setCategoryIcons] = useState<Record<CategoryKey, string> | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    updateDraft({
      selectedPlaces: picked,
      mustVisitPlaceIds: picked.flatMap((p) => (p.placeId === null ? [] : [p.placeId])),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  const limit = useMemo(
    () => tripDays(draft.startDate, draft.endDate) * 3,
    [draft.startDate, draft.endDate],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const icons = Object.fromEntries(
        Object.entries(CATEGORY_ICON_COMPONENTS).map(([key, Icon]) => [
          key,
          renderToStaticMarkup(
            <Icon color="#fff" size={14} strokeWidth={2.4} absoluteStrokeWidth />,
          ),
        ]),
      ) as Record<CategoryKey, string>;
      setCategoryIcons(icons);
    });
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    let cancelled = false;
    (async () => {
      setRegionLoading(true);
      try {
        const data = await searchPlacesGeo({
          longitude: selectedDistrict.lng,
          latitude: selectedDistrict.lat,
          radius: 6000,
        });
        if (!cancelled) setRegionPlaces(data.items);
      } catch {
        if (!cancelled) setRegionPlaces([]);
      } finally {
        if (!cancelled) setRegionLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDistrict]);

  useEffect(() => {
    if (!selectedDistrict || regionLoading) return;
    const t = setTimeout(() => setShowRegionMap(true), 180);
    return () => clearTimeout(t);
  }, [selectedDistrict, regionLoading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const keyword = query.trim();
    if (keyword.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchPlaces(keyword, controller.signal);
        if (!controller.signal.aborted) setResults(response.items);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "장소를 검색하지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function focusPlace(place: PlaceSearchItem) {
    setMapCenter({ lat: place.latitude, lng: place.longitude });
    setActivePlace(place);
  }

  function savePicked(nextPicked: PlaceSearchItem[]) {
    setPicked(nextPicked);
  }

  async function addPlace(place: PlaceSearchItem) {
    if (picked.length >= limit) {
      setError(`장소는 최대 ${limit}개까지 담을 수 있어요.`);
      return;
    }
    if (picked.some((item) => isSamePlace(item, place))) return;
    const key = selectionKey(place);
    setResolvingKey(key);
    setError(null);
    try {
      const resolved = await resolvePlace(place);
      setPicked((prev) => {
        if (prev.some((item) => isSamePlace(item, resolved))) return prev;
        return [...prev, resolved];
      });
      setActivePlace(resolved);
      setShowResults(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "장소를 담지 못했습니다.");
    } finally {
      setResolvingKey(null);
    }
  }

  function removePlace(place: PlaceSearchItem) {
    savePicked(picked.filter((item) => !isSamePlace(item, place)));
  }

  function selectDistrict(selection: DistrictSelection) {
    setSelectedDistrict(selection);
    setActivePlace(null);
    setMapCenter({ lat: selection.lat, lng: selection.lng });
    setShowRegionMap(false);
    setRegionActiveOrder(null);
    setRegion3DActiveId(null);
  }

  function backToDistrictPicker() {
    setSelectedDistrict(null);
    setRegionPlaces([]);
    setShowRegionMap(false);
    setRegionActiveOrder(null);
    setRegion3DActiveId(null);
  }

  function handleRegionBackButton() {
    if (mapView === "2d" && regionActiveOrder != null) {
      setRegionActiveOrder(null);
    } else if (mapView === "3d" && region3DActiveId != null) {
      setRegion3DActiveId(null);
    } else {
      backToDistrictPicker();
    }
  }

  function handleRegionMarkerAdd(order: number) {
    const p = regionPlaces[order - 1];
    if (!p) return;
    void addPlace(summaryToSearchItem(p));
  }

  function handleRegion3DMarkerAdd(id: number) {
    const p = regionPlaces.find((x) => x.id === id);
    if (!p) return;
    void addPlace(summaryToSearchItem(p));
  }

  const regionMarkers: MapTiler3DMarker[] = regionPlaces.map((p) => ({
    id: p.id,
    lat: p.latitude,
    lng: p.longitude,
    label: p.name,
    added: picked.some((x) => x.placeId === p.placeId),
    icon: categoryIcons?.[categoryKey(p.categoryLabel)],
  }));

  const regionRoutePoints = regionPlaces.map((p, i) => ({
    lat: p.latitude,
    lng: p.longitude,
    order: i + 1,
    color: "#2E7DF2",
    label: p.name,
    tag: [p.categoryLabel, p.address].filter(Boolean).join(" · "),
    added: picked.some((x) => x.placeId === p.placeId),
    icon: categoryIcons?.[categoryKey(p.categoryLabel)],
  }));

  return (
    <PageFade className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-5 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">일정 담기</h1>
        <button
          type="button"
          onClick={() => router.push("/trips/new/preview")}
          className="shrink-0 text-sm font-medium text-zinc-400"
        >
          건너뛰기
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-4 pb-6">
        <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
          {(
            [
              { key: "search", label: "검색" },
              { key: "region", label: "지역" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                mode === tab.key
                  ? "bg-white text-[#2E7DF2] shadow-sm"
                  : "text-zinc-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "search" ? (
          <div className="relative" ref={searchWrapperRef}>
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5">
              <Image src={searchIcon} alt="" width={16} height={16} className="shrink-0" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                  if (e.target.value.trim().length < 2) setResults([]);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="가고 싶은 장소를 검색해보세요"
                className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>

            {showResults && query.trim().length >= 2 && (
              <div className="absolute inset-x-0 top-full z-20 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
                <ul className="flex flex-col gap-2">
                  {loading && results.length === 0 && (
                    <p className="py-2 text-center text-sm text-zinc-400">검색 중...</p>
                  )}
                  {!loading && results.length === 0 && (
                    <p className="py-2 text-center text-sm text-zinc-400">검색 결과가 없어요</p>
                  )}
                  {results.map((place) => {
                    const selected = picked.some((item) => isSamePlace(item, place));
                    const resolving = resolvingKey === selectionKey(place);
                    return (
                      <li
                        key={selectionKey(place)}
                        onClick={() => focusPlace(place)}
                        className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-zinc-50"
                      >
                        <PlaceThumbnail place={place} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{place.name}</p>
                          <p className="mt-0.5 truncate text-xs text-zinc-400">
                            {place.categoryLabel ?? placeCategoryLabel(place.category)} ·{" "}
                            {place.address}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void addPlace(place);
                          }}
                          disabled={selected || Boolean(resolvingKey)}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selected || Boolean(resolvingKey)
                              ? "bg-zinc-100 text-zinc-400"
                              : "bg-[#EAF2FE] text-[#2E7DF2] hover:bg-[#DCEBFD]"
                          }`}
                        >
                          {resolving ? "확인 중" : selected ? "담음" : "+ 추가"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-[min(27.5rem,42dvh)] w-full shrink-0 overflow-hidden rounded-3xl bg-zinc-50 ring-1 ring-black/5">
            <AnimatePresence>
              {showRegionMap && selectedDistrict ? (
                <motion.div
                  key="map"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  {mapView === "2d" ? (
                    <NaverMap
                      center={{ lat: selectedDistrict.lat, lng: selectedDistrict.lng }}
                      zoom={13}
                      route={regionRoutePoints}
                      showRouteLine={false}
                      activeRouteOrder={regionActiveOrder}
                      onRouteMarkerSelect={setRegionActiveOrder}
                      onRouteMarkerAdd={handleRegionMarkerAdd}
                      className="h-full w-full"
                    />
                  ) : (
                    <MapTiler3D
                      center={{ lat: selectedDistrict.lat, lng: selectedDistrict.lng }}
                      zoom={14}
                      markers={regionMarkers}
                      activeMarkerId={region3DActiveId}
                      onMarkerSelect={setRegion3DActiveId}
                      className="h-full w-full"
                    />
                  )}
                  <MapViewToggle view={mapView} onChange={setMapView} />
                  <button
                    type="button"
                    onClick={handleRegionBackButton}
                    className="absolute top-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm backdrop-blur hover:bg-white"
                  >
                    {(mapView === "2d" && regionActiveOrder != null) ||
                    (mapView === "3d" && region3DActiveId != null)
                      ? "− 줌아웃"
                      : "← 지역 다시 선택"}
                  </button>
                  {mapView === "3d" && region3DActiveId != null ? (
                    (() => {
                      const activePlace3D = regionPlaces.find(
                        (p) => p.id === region3DActiveId,
                      );
                      if (!activePlace3D) return null;
                      const already = picked.some((x) => x.placeId === activePlace3D.placeId);
                      return (
                        <div className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {activePlace3D.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-400">
                              {[activePlace3D.categoryLabel, activePlace3D.address]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRegion3DMarkerAdd(activePlace3D.id)}
                            disabled={already}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                              already
                                ? "bg-zinc-100 text-zinc-400"
                                : "bg-[#EAF2FE] text-[#2E7DF2] hover:bg-[#DCEBFD]"
                            }`}
                          >
                            {already ? "담음" : "+ 추가"}
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">
                      📍 {selectedDistrict.name}
                      {regionLoading && (
                        <span className="ml-1 text-zinc-400">불러오는 중...</span>
                      )}
                      {!regionLoading && regionPlaces.length === 0 && (
                        <span className="ml-1 text-zinc-400">주변 장소 없음</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="picker"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.25 }}
                  transition={{ duration: 0.22, ease: "easeIn" }}
                  className="absolute inset-0"
                >
                  <BusanDistrictPicker
                    selected={selectedDistrict?.code ?? null}
                    onSelect={selectDistrict}
                    className="h-full w-full"
                  />
                  {!selectedDistrict && (
                    <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] text-zinc-400">
                      구를 눌러 주변 장소를 찾아보세요
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {mode === "search" && (
          <div className="relative h-[min(24rem,35dvh)] w-full shrink-0">
            {mapView === "2d" ? (
              <NaverMap
                center={mapCenter}
                zoom={activePlace ? 17 : undefined}
                place={
                  activePlace
                    ? {
                        name: activePlace.name,
                        tag: `${activePlace.categoryLabel ?? placeCategoryLabel(activePlace.category)} · ${activePlace.address ?? ""}`,
                        alreadyAdded: picked.some((item) => isSamePlace(item, activePlace)),
                      }
                    : null
                }
                onAddPlace={() => activePlace && void addPlace(activePlace)}
                className="h-full w-full rounded-2xl"
              />
            ) : (
              <MapTiler3D
                center={mapCenter}
                zoom={activePlace ? 17 : 13}
                markers={
                  activePlace
                    ? [
                        {
                          lat: activePlace.latitude,
                          lng: activePlace.longitude,
                          label: activePlace.name,
                        },
                      ]
                    : []
                }
                className="h-full w-full overflow-hidden rounded-2xl"
              />
            )}
            <MapViewToggle view={mapView} onChange={setMapView} />
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-auto -mx-5 -mb-6 rounded-t-3xl bg-white px-5 pt-4 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <section>
            <h2 className="mb-3 text-sm font-semibold">
              담은 장소 {picked.length}
              <span className="text-zinc-400"> / 최대 {limit}</span>
            </h2>
            <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
              {picked.map((place, i) => (
                <li
                  key={selectionKey(place)}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <PlaceThumbnail place={place} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{place.name}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {place.categoryLabel ?? placeCategoryLabel(place.category)}
                      {place.address ? ` · ${place.address}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePlace(place)}
                    aria-label="삭제"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-black/5"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <button
            type="button"
            onClick={() => router.push("/trips/new/preview")}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity"
          >
            {picked.length > 0 ? "이 장소들로 일정 만들기" : "AI에게 맡기기"}{" "}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </PageFade>
  );
}
