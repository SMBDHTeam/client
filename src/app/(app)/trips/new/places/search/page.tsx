"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import NaverMap from "@/components/NaverMap";
import searchIcon from "@/assets/icons/search-256.png";
import { resolvePlace, searchPlaces } from "@/lib/api/places";
import { placeCategoryLabel } from "@/lib/place-category";
import { useTripDraft } from "@/store/trip-draft";
import type { PlaceSearchItem } from "@/types/api/place";

function selectionKey(place: PlaceSearchItem) {
  return place.placeId !== null ? `place:${place.placeId}` : `${place.source}:${place.externalId}`;
}

function isSamePlace(left: PlaceSearchItem, right: PlaceSearchItem) {
  if (left.placeId !== null && right.placeId !== null) return left.placeId === right.placeId;
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

function PlaceThumbnail({ place }: { place: PlaceSearchItem }) {
  if (!place.primaryImageUrl) {
    return <div className="size-10 shrink-0 rounded-lg bg-linear-to-br from-[#2E7DF2] to-[#17B89B]" />;
  }
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-[#2E7DF2] to-[#17B89B]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={place.primaryImageUrl}
        alt=""
        referrerPolicy="no-referrer"
        onError={(event) => event.currentTarget.remove()}
        className="size-full object-cover"
      />
    </div>
  );
}

export default function TripPlacesSearchPage() {
  const router = useRouter();
  const { draft, updateDraft } = useTripDraft();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchItem[]>([]);
  const [picked, setPicked] = useState(draft.selectedPlaces);
  const [loading, setLoading] = useState(false);
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();
  const [activePlace, setActivePlace] = useState<PlaceSearchItem | null>(null);
  const [showResults, setShowResults] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const limit = useMemo(
    () => tripDays(draft.startDate, draft.endDate) * 3,
    [draft.endDate, draft.startDate],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
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
    updateDraft({
      selectedPlaces: nextPicked,
      mustVisitPlaceIds: nextPicked.flatMap((place) =>
        place.placeId === null ? [] : [place.placeId],
      ),
    });
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
      savePicked([...picked, resolved]);
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

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-5 pt-4">
        <button type="button" onClick={() => router.back()} aria-label="뒤로 가기" className="-ml-1 grid size-8 shrink-0 place-items-center text-2xl text-zinc-600">‹</button>
        <h1 className="flex-1 text-center text-base font-semibold">일정 담기</h1>
        <button type="button" onClick={() => router.push("/trips/new/preview")} className="shrink-0 text-sm font-medium text-zinc-400">건너뛰기</button>
      </header>

      <div className="flex flex-1 flex-col gap-5 px-5 pt-4 pb-6">
        <div className="relative" ref={searchWrapperRef}>
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5">
            <Image src={searchIcon} alt="" width={16} height={16} className="shrink-0" />
            <input
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                setShowResults(true);
                if (nextQuery.trim().length < 2) setResults([]);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="장소를 검색해보세요"
              className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {showResults && query.trim().length >= 2 && (
            <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
              {loading && <p className="py-3 text-center text-sm text-zinc-400">검색 중...</p>}
              {!loading && results.length === 0 && <p className="py-3 text-center text-sm text-zinc-400">검색 결과가 없어요</p>}
              <ul className="flex flex-col gap-1">
                {results.map((place) => {
                  const selected = picked.some((item) => isSamePlace(item, place));
                  const resolving = resolvingKey === selectionKey(place);
                  return (
                    <li key={selectionKey(place)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-50">
                      <button type="button" onClick={() => focusPlace(place)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <PlaceThumbnail place={place} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{place.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-zinc-400">{place.categoryLabel ?? placeCategoryLabel(place.category)} · {place.address}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addPlace(place)}
                        disabled={selected || Boolean(resolvingKey)}
                        className="shrink-0 rounded-full bg-[#EAF2FE] px-3 py-1.5 text-xs font-semibold text-[#2E7DF2] disabled:bg-zinc-100 disabled:text-zinc-400"
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

        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <NaverMap
          center={mapCenter}
          place={activePlace ? { name: activePlace.name, tag: `${placeCategoryLabel(activePlace.category)} · ${activePlace.address ?? ""}`, alreadyAdded: picked.some((item) => isSamePlace(item, activePlace)) } : null}
          onAddPlace={() => activePlace && void addPlace(activePlace)}
          className="h-80 w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-100"
        />

        <div className="mt-auto -mx-5 -mb-6 rounded-t-3xl bg-white px-5 pt-4 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">담은 장소 {picked.length}</h2>
            <span className="text-xs text-zinc-400">최대 {limit}개</span>
          </div>
          {picked.length > 0 && (
            <ul className="mt-3 flex max-h-44 flex-col gap-2 overflow-y-auto">
              {picked.map((place, index) => (
                <li key={selectionKey(place)} className="flex items-center gap-3 rounded-2xl p-3 ring-1 ring-black/5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">{index + 1}</span>
                  <PlaceThumbnail place={place} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{place.name}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">
                      {place.categoryLabel ?? placeCategoryLabel(place.category)}{place.address ? ` · ${place.address}` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => removePlace(place)} aria-label={`${place.name} 삭제`} className="grid size-8 place-items-center text-zinc-400">×</button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => router.push("/trips/new/preview")}
            className="mt-4 w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 font-medium text-white"
          >
            {picked.length > 0 ? "이 장소들로 일정 만들기 →" : "AI에게 맡기기 →"}
          </button>
        </div>
      </div>
    </div>
  );
}
