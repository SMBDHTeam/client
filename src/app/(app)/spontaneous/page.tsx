"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NaverMap from "@/components/map/NaverMap";
import { searchStartLocations } from "@/lib/api/spontaneous-trips";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import { ApiError } from "@/lib/api/axios";
import searchIcon from "@/assets/icons/search.png";
import type { StartLocationItem } from "@/types/api/spontaneous-trip";

const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

export default function SpontaneousStartPage() {
  const router = useRouter();
  const { setStartLocation } = useSpontaneousDraft();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<StartLocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StartLocationItem | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(value: string) {
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
    setSelected(item);
    setKeyword(item.name);
    setResults([]);
    setStartLocation(item);
  }

  const mapCenter = selected
    ? { lat: selected.latitude, lng: selected.longitude }
    : BUSAN_CENTER;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        <h1 className="text-lg font-bold">즉흥여행</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-6">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 focus-within:border-[#2E7DF2] focus-within:ring-2 focus-within:ring-[#2E7DF2]/20">
            <Image src={searchIcon} alt="" width={18} height={18} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="출발지를 검색하세요"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {loading && (
              <div className="size-4 animate-spin rounded-full border-2 border-zinc-200 border-t-[#2E7DF2]" />
            )}
          </div>

          {results.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-10 mt-1 flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg">
              {results.map((item) => (
                <li key={item.externalId}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                  >
                    <p className="text-sm font-semibold text-zinc-800">{item.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">{item.address}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        <div className="relative h-[min(27.5rem,42dvh)] w-full overflow-hidden rounded-3xl bg-zinc-100">
          <NaverMap
            center={mapCenter}
            zoom={selected ? 16 : 12}
            className="h-full w-full"
          />
        </div>
      </div>

      <div className="px-5 pb-4">
        <button
          type="button"
          disabled={!selected}
          onClick={() => router.push("/spontaneous/conditions")}
          className="w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
