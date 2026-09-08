"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Search, Trash2 } from "lucide-react";
import { getSchedule, updateSchedule } from "@/lib/api/schedules";
import { searchPlacesGeo as searchPlaces } from "@/lib/api/places";
import { toast } from "sonner";
import type { PlaceSummary } from "@/types/api/place";

type EditableStop = {
  key: string;
  stopId: string | null;
  placeId: number;
  name: string;
  subtitle: string;
  stayMinutes: number;
};

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [dayStops, setDayStops] = useState<Record<number, EditableStop[]>>({});
  const [days, setDays] = useState<number[]>([]);
  const [activeDay, setActiveDay] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getSchedule(params.id)
      .then((res) => {
        const init: Record<number, EditableStop[]> = {};
        for (const day of res.days) {
          init[day.dayNo] = day.stops.map((s) => ({
            key: s.id,
            stopId: s.id,
            placeId: s.place.id,
            name: s.place.name,
            subtitle: [s.place.categoryLabel, s.place.address].filter(Boolean).join(" · "),
            stayMinutes: Math.max(30, s.stayMinutes),
          }));
        }
        setDayStops(init);
        setDays(res.days.map((d) => d.dayNo));
        setActiveDay(res.days[0]?.dayNo ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

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
      if (list.some((s) => s.placeId === p.id)) return prev;
      const newStop: EditableStop = {
        key: `new-${p.id}-${Date.now()}`,
        stopId: null,
        placeId: p.id,
        name: p.name,
        subtitle: [p.categoryLabel, p.address].filter(Boolean).join(" · "),
        stayMinutes: 60,
      };
      return { ...prev, [activeDay]: [...list, newStop] };
    });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const stops = Object.entries(dayStops).flatMap(([dayNo, list]) =>
        list.map((s, i) => ({
          stopId: s.stopId,
          placeId: s.stopId ? null : s.placeId,
          dayNo: Number(dayNo),
          order: i + 1,
          stayMinutes: Math.max(30, s.stayMinutes),
        }))
      );
      await updateSchedule(params.id, stops);
      toast.success("일정이 수정됐어요.");
      router.back();
    } catch {
      toast.error("일정을 수정하지 못했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">일정 수정</h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] px-4 py-1.5 text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
        >
          {saving ? "저장 중..." : "완료"}
        </button>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-[#2E7DF2]" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {days.length > 1 && (
            <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDay(d)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors cursor-pointer ${
                    activeDay === d
                      ? "bg-white text-[#2E7DF2] shadow-sm"
                      : "text-zinc-400"
                  }`}
                >
                  Day {d}
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
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      {s.subtitle && (
                        <p className="mt-0.5 truncate text-xs text-zinc-400">{s.subtitle}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(s.key)}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-black/5 cursor-pointer"
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
                  const already = activeStops.some((s) => s.placeId === p.id);
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
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-default ${
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
      )}
    </div>
  );
}
