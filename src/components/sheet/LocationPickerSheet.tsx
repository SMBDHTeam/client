"use client";

import { useEffect, useRef, useState } from "react";
import NaverMap from "@/components/NaverMap";
import { searchLocations } from "@/lib/api/locations";
import type { LocationInput } from "@/types/api/common";

export default function LocationPickerSheet({
  title,
  initial,
  onClose,
  onSelect,
}: {
  title: string;
  initial?: LocationInput | null;
  onClose: () => void;
  onSelect: (point: LocationInput) => void;
}) {
  const [shown, setShown] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [candidate, setCandidate] = useState<LocationInput | null>(
    initial ?? null,
  );
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node))
        setShowResults(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await searchLocations(trimmed, controller.signal);
        if (!controller.signal.aborted) setResults(data.items);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function pick(item: LocationInput) {
    setCandidate(item);
    setQuery(item.name);
    setShowResults(false);
  }

  function confirm() {
    if (!candidate) return;
    onSelect(candidate);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="relative flex w-full max-w-lg flex-col justify-end">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative flex flex-col rounded-t-3xl bg-white transition-transform duration-300 ease-out ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center gap-2 px-5 pt-3 pb-2">
          <div className="mx-auto absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-zinc-200" />
          <h2 className="flex-1 pt-2 text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-8 place-items-center rounded-full text-xl text-zinc-500 hover:bg-black/5"
          >
            ✕
          </button>
        </div>

        <div className="relative px-5" ref={searchWrapRef}>
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4 shrink-0 fill-none stroke-zinc-400 stroke-2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="장소를 검색해보세요"
              className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {showResults && query.trim() && (
            <div className="absolute inset-x-5 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
              {loading && results.length === 0 && (
                <p className="py-2 text-center text-sm text-zinc-400">검색 중...</p>
              )}
              {!loading && results.length === 0 && (
                <p className="py-2 text-center text-sm text-zinc-400">
                  검색 결과가 없어요
                </p>
              )}
              <ul className="flex flex-col">
                {results.map((r) => (
                  <li key={`${r.name}-${r.longitude}-${r.latitude}`}>
                    <button
                      type="button"
                      onClick={() => pick(r)}
                      className="flex w-full flex-col items-start rounded-xl p-2.5 text-left hover:bg-zinc-50"
                    >
                      <span className="text-sm font-semibold">{r.name}</span>
                      {r.address && (
                        <span className="mt-0.5 text-xs text-zinc-400">
                          {r.address}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="relative mt-3 h-[34dvh] px-5">
          <NaverMap
            center={
              candidate
                ? { lat: candidate.latitude, lng: candidate.longitude }
                : undefined
            }
            showAddAction={false}
            className="h-full w-full overflow-hidden rounded-2xl"
          />
        </div>

        <div className="border-t border-zinc-100 bg-white px-5 pt-3 pb-6">
          <button
            type="button"
            onClick={confirm}
            disabled={!candidate}
            className="w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
          >
            이 위치로 선택
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
