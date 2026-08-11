"use client";

import { useEffect, useState } from "react";
import { searchLocations } from "@/lib/api/locations";
import type { LocationInput } from "@/types/api/common";

export default function LocationSearchField({
  label,
  value,
  onChange,
  placeholder = "장소를 검색해 주세요",
  autoFocus = false,
}: {
  label: string;
  value?: LocationInput;
  onChange: (location: LocationInput) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<LocationInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const keyword = query.trim();
    if (keyword.length < 2 || keyword === value?.name) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchLocations(keyword, controller.signal);
        if (controller.signal.aborted) return;
        setResults(response.items);
        setOpen(true);
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "장소를 검색하지 못했습니다.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, value?.name]);

  function selectLocation(location: LocationInput) {
    onChange(location);
    setQuery(location.name);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-zinc-800">
        {label}
        <input
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (nextQuery.trim().length < 2) setResults([]);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-[#2E7DF2]"
        />
      </label>

      {loading && <p className="mt-2 text-xs text-zinc-400">검색 중...</p>}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-100 bg-white p-1 shadow-lg">
          {results.map((location) => (
            <li key={`${location.name}-${location.longitude}-${location.latitude}`}>
              <button
                type="button"
                onClick={() => selectLocation(location)}
                className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-zinc-50"
              >
                <span className="block text-sm font-semibold">{location.name}</span>
                <span className="mt-0.5 block truncate text-xs text-zinc-400">
                  {location.address}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
