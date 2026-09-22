"use client";

import Image from "next/image";
import { ChevronLeft, Lightbulb, MapPin, Minus, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import NaverMap from "@/components/map/NaverMap";
import { searchStartLocations } from "@/lib/api/spontaneous-trips";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import { ApiError } from "@/lib/api/axios";
import type { StartLocationItem } from "@/types/api/spontaneous-trip";

const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

export default function SpontaneousStartPage() {
  const router = useRouter();
  const { hydrated, setStartLocation, resetDraft } = useSpontaneousDraft();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StartLocationItem[]>([]);
  const [selected, setSelected] = useState<StartLocationItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [mapView, setMapView] = useState<{
    center: { lat: number; lng: number };
    zoom: number;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputValue = editingLocation ? keyword : (selected?.name ?? keyword);
  const mapCenter = mapView?.center ?? (selected
    ? { lat: selected.latitude, lng: selected.longitude }
    : BUSAN_CENTER);
  const mapZoom = mapView?.zoom ?? 12;

  useEffect(() => {
    if (!hydrated) return;
    resetDraft();
  }, [hydrated, resetDraft]);

  function handleInput(value: string) {
    setEditingLocation(true);
    setKeyword(value);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchStartLocations(value.trim());
        setResults(data.items);
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : "검색 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(item: StartLocationItem) {
    setKeyword(item.name);
    setResults([]);
    setSelected(item);
    setStartLocation(item);
    setEditingLocation(false);
    setMapView(null);
  }

  function handleChangeLocation() {
    setEditingLocation(true);
    setKeyword("");
    setResults([]);
    setError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="flex flex-1 flex-col bg-[#fafdff]">
      <header className="relative flex h-24 shrink-0 items-center overflow-hidden px-5">
        <Image
          src="/trips-covers/header-busan.png"
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 512px"
          className="object-cover object-[68%_69%] opacity-75"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/55 to-white/5" />
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="relative z-10 -ml-2 grid size-11 shrink-0 place-items-center rounded-full text-[#0d234f] transition-colors hover:bg-white/60 active:bg-white/80"
        >
          <ChevronLeft size={34} strokeWidth={2.4} />
        </button>
        <h1 className="relative z-10 ml-2 text-[1.5rem] font-extrabold tracking-[-0.045em] text-[#0b2146]">
          제로플랜
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-5">
        <div className="relative">
          <div className="flex h-16 items-center gap-3 rounded-[1.65rem] border border-[#cbd6e7] bg-white px-5 shadow-[0_8px_24px_rgba(55,103,160,0.08)] transition focus-within:border-[#2E7DF2] focus-within:ring-4 focus-within:ring-[#2E7DF2]/10">
            <Search className="shrink-0 text-[#35527d]" size={27} strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="출발지를 검색하세요"
              className="min-w-0 flex-1 bg-transparent text-[1.05rem] font-medium tracking-[-0.02em] text-[#172b51] outline-none placeholder:text-[#667b9e]"
            />
            {loading && (
              <div
                aria-label="검색 중"
                className="size-5 shrink-0 animate-spin rounded-full border-2 border-[#dfe8f4] border-t-[#2E7DF2]"
              />
            )}
          </div>
          <p className="mt-3 px-1 text-[0.95rem] font-semibold tracking-[-0.025em] text-[#1465df]">
            부산 내에서만 검색할 수 있어요.
          </p>

          {results.length > 0 && (
            <ul className="absolute top-[4.25rem] right-0 left-0 z-30 mt-1 flex max-h-72 flex-col overflow-y-auto rounded-2xl border border-[#dce5f1] bg-white py-1 shadow-[0_16px_36px_rgba(27,65,114,0.18)]">
              {results.map((item) => (
                <li key={item.externalId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-5 py-3 text-left transition-colors hover:bg-[#f3f8ff] active:bg-[#eaf3ff]"
                  >
                    <p className="text-sm font-semibold text-[#172b51]">{item.name}</p>
                    <p className="mt-1 text-xs text-[#7789a6]">{item.address}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="relative h-[clamp(18rem,38dvh,27rem)] w-full shrink-0 overflow-hidden rounded-[1.7rem] bg-[#eef4f8] shadow-[0_10px_28px_rgba(38,87,137,0.1)]">
          <NaverMap
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
          />
          <div className="absolute right-3 bottom-3 z-10 flex flex-col overflow-hidden rounded-2xl border border-[#d5dfeb] bg-white shadow-[0_5px_16px_rgba(24,59,101,0.18)]">
            <button
              type="button"
              aria-label="지도 확대"
              onClick={() => setMapView({ center: mapCenter, zoom: Math.min(20, mapZoom + 1) })}
              className="grid size-12 place-items-center text-[#17366c] transition-colors hover:bg-[#f3f8ff] active:bg-[#e8f2ff]"
            >
              <Plus size={26} strokeWidth={2} />
            </button>
            <span className="mx-2 h-px bg-[#e4eaf1]" />
            <button
              type="button"
              aria-label="지도 축소"
              onClick={() => setMapView({ center: mapCenter, zoom: Math.max(6, mapZoom - 1) })}
              className="grid size-12 place-items-center text-[#17366c] transition-colors hover:bg-[#f3f8ff] active:bg-[#e8f2ff]"
            >
              <Minus size={26} strokeWidth={2} />
            </button>
          </div>
        </div>

        {selected && (
          <section className="rounded-[1.7rem] border border-[#d8e2ee] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(38,87,137,0.07)]">
            <h2 className="text-[0.95rem] font-semibold text-[#284a7c]">선택한 출발지</h2>
            <div className="mt-3 flex items-center gap-4">
              <div className="grid size-[3.75rem] shrink-0 place-items-center rounded-full bg-[#e9f5ff]">
                <span className="relative block size-9 text-[#3886ef]">
                  <MapPin size={36} fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
                  <span className="absolute top-[9px] left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-white" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[1.15rem] font-bold tracking-[-0.025em] text-[#10254e]">
                  {selected.name}
                </p>
                <p className="mt-1 truncate text-[0.9rem] text-[#7183a2]">{selected.address}</p>
              </div>
              <button
                type="button"
                onClick={handleChangeLocation}
                className="shrink-0 rounded-2xl border-2 border-[#1672ee] px-5 py-2.5 text-sm font-semibold text-[#1269df] transition-colors hover:bg-[#f2f7ff] active:bg-[#e8f2ff]"
              >
                변경
              </button>
            </div>
          </section>
        )}

        <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-[#e9f5ff] px-5 py-3 text-[#1465df]">
          <Lightbulb size={25} strokeWidth={2} className="shrink-0" />
          <p className="text-[0.95rem] font-semibold tracking-[-0.025em]">
            {selected ? "이곳을 출발지로 설정할게요" : "검색한 장소를 출발지로 선택해 주세요"}
          </p>
        </div>

        <button
          type="button"
          disabled={!selected}
          onClick={() => router.push("/spontaneous/conditions")}
          className="mt-1 w-full rounded-full bg-linear-to-r from-[#2f7bf4] via-[#16add3] to-[#16cdb7] py-4 text-center text-[1.05rem] font-semibold text-white shadow-[0_10px_22px_rgba(31,142,202,0.2)] transition disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99]"
        >
          다음
        </button>
      </div>
    </div>
  );
}
