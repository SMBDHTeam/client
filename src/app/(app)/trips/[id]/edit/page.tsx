"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Search, Trash2 } from "lucide-react";
import { getItinerary, type ItineraryPlace } from "@/mocks/itinerary";
import { searchPlacesGeo as searchPlaces } from "@/lib/api/places";
import type { PlaceSummary } from "@/types/api/place";

type EditableStop = ItineraryPlace & { key: string };

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const itinerary = getItinerary(params.id);

  const [dayStops, setDayStops] = useState<Record<number, EditableStop[]>>(() => {
    const init: Record<number, EditableStop[]> = {};
    for (const d of itinerary) {
      init[d.day] = d.places.map((p) => ({ ...p, key: p.id }));
    }
    return init;
  });

  const [activeDay, setActiveDay] = useState(itinerary[0]?.day ?? 1);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [searching, setSearching] = useState(false);

  const activeStops = dayStops[activeDay] ?? [];

  let searchTimer: ReturnType<typeof setTimeout>;
  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(searchTimer);
    if (!value.trim()) { setResults([]); return; }
    searchTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchPlaces({ keyword: value.trim() });
        setResults(data.items);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function removeStop(key: string) {
    setDayStops((prev) => ({
      ...prev,
      [activeDay]: (prev[activeDay] ?? []).filter((s) => s.key !== key),
    }));
  }

  function addPlace(p: PlaceSummary) {
    setDayStops((prev) => {
      const list = prev[activeDay] ?? [];
      if (list.some((s) => s.id === String(p.id))) return prev;
      const newStop: EditableStop = {
        key: `new-${p.id}-${Date.now()}`,
        id: String(p.id),
        order: list.length + 1,
        time: "",
        title: p.name,
        subtitle: [p.categoryLabel, p.address].filter(Boolean).join(" · "),
        gradient: "from-[#2E7DF2] to-[#17B89B]",
        lat: p.latitude,
        lng: p.longitude,
        color: "#2E7DF2",
      };
      return { ...prev, [activeDay]: [...list, newStop] };
    });
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">일정 수정</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] px-4 py-1.5 text-sm font-semibold text-white"
        >
          완료
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {itinerary.length > 1 && (
          <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
            {itinerary.map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setActiveDay(d.day)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                  activeDay === d.day
                    ? "bg-white text-[#2E7DF2] shadow-sm"
                    : "text-zinc-400"
                }`}
              >
                Day {d.day}
              </button>
            ))}
          </div>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-600">
            Day {activeDay} 방문지 {activeStops.length}곳
          </h2>
          {activeStops.length === 0 ? (
            <p className="rounded-2xl bg-zinc-50 p-4 text-center text-sm text-zinc-400">
              이 날엔 방문지가 없어요. 아래에서 검색해 담아보세요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {activeStops.map((s, i) => (
                <li
                  key={s.key}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    {s.subtitle && (
                      <p className="mt-0.5 truncate text-xs text-zinc-400">{s.subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStop(s.key)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-black/5"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-600">
            Day {activeDay}에 장소 추가
          </h2>
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5">
            <Search size={16} className="shrink-0 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="추가하고 싶은 장소를 검색해보세요"
              className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {query.trim() && (
            <ul className="flex flex-col gap-1">
              {searching && results.length === 0 && (
                <p className="py-2 text-center text-sm text-zinc-400">검색 중...</p>
              )}
              {!searching && results.length === 0 && (
                <p className="py-2 text-center text-sm text-zinc-400">검색 결과가 없어요</p>
              )}
              {results.map((p) => {
                const already = activeStops.some((s) => s.id === String(p.id));
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-zinc-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        {[p.categoryLabel, p.address].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addPlace(p)}
                      disabled={already}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        already
                          ? "bg-zinc-100 text-zinc-400"
                          : "bg-[#EAF2FE] text-[#2E7DF2] hover:bg-[#DCEBFD]"
                      }`}
                    >
                      {already ? "담음" : "+ 추가"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
