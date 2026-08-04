"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";
import PageFade from "@/components/ui/PageFade";
import { getSchedules, searchPlaces, updateSchedule } from "@/services";
import type {
  PlaceSummary,
  Schedule,
  ScheduleListItem,
  UpdateScheduleStop,
} from "@/types/api";

type Schedulish = Schedule | ScheduleListItem;

type EditableStop = {
  key: string;
  stopId?: string;
  placeId?: number;
  name: string;
  tag: string;
  stayMinutes: number;
};

function buildDayStops(schedule: Schedulish): Record<number, EditableStop[]> {
  const init: Record<number, EditableStop[]> = {};
  for (const d of schedule.days) {
    init[d.dayNo] = d.stops.map((s) => ({
      key: `stop-${s.id}`,
      stopId: s.id,
      name: s.place.name,
      tag: s.place.categoryLabel ?? "",
      stayMinutes: s.stayMinutes,
    }));
  }
  return init;
}

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [schedule, setSchedule] = useState<Schedulish | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [dayStops, setDayStops] = useState<Record<number, EditableStop[]>>({});
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSchedules()
      .then((data) => {
        if (cancelled) return;
        const found = data.items.find((s) => s.id === id);
        if (!found) {
          setNotFound(true);
          return;
        }
        setSchedule(found);
        setDayStops(buildDayStops(found));
        setActiveDay(found.days[0]?.dayNo ?? 1);
      })
      .catch(() => !cancelled && setNotFound(true));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(async () => {
      if (!trimmed) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const data = await searchPlaces({ keyword: trimmed });
        setResults(data.items);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-sm text-zinc-500">일정을 찾을 수 없어요.</p>
        <button
          type="button"
          onClick={() => router.push("/trips")}
          className="rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] px-6 py-2.5 text-sm font-semibold text-white"
        >
          내 일정으로
        </button>
      </div>
    );
  }

  if (!schedule || activeDay == null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-400">불러오는 중...</p>
      </div>
    );
  }

  const activeStops = dayStops[activeDay] ?? [];

  function removeStop(key: string) {
    if (activeDay == null) return;
    setDayStops((prev) => ({
      ...prev,
      [activeDay]: (prev[activeDay] ?? []).filter((s) => s.key !== key),
    }));
  }

  function addPlace(p: PlaceSummary) {
    if (activeDay == null) return;
    setDayStops((prev) => {
      const list = prev[activeDay] ?? [];
      if (list.some((s) => s.placeId === p.id)) return prev;
      return {
        ...prev,
        [activeDay]: [
          ...list,
          {
            key: `new-${p.id}-${Date.now()}`,
            placeId: p.id,
            name: p.name,
            tag: [p.categoryLabel, p.address].filter(Boolean).join(" · "),
            stayMinutes: 60,
          },
        ],
      };
    });
  }

  async function handleSave() {
    if (!schedule) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const stops: UpdateScheduleStop[] = [];
      for (const d of schedule.days) {
        const list = dayStops[d.dayNo] ?? [];
        list.forEach((s, i) => {
          stops.push({
            ...(s.stopId ? { stopId: s.stopId } : { placeId: s.placeId }),
            dayNo: d.dayNo,
            order: i + 1,
            stayMinutes: s.stayMinutes,
          });
        });
      }
      await updateSchedule(schedule.id, { stops });
      router.push(`/trips/${id}`);
    } catch {
      setErrorMsg("저장에 실패했어요. 다시 시도해 주세요.");
      setSaving(false);
    }
  }

  return (
    <PageFade className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">
          일정 수정
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] px-3.5 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {saving ? "저장 중..." : "완료"}
        </button>
      </header>

      {errorMsg && (
        <p className="px-5 pb-1 text-center text-xs font-medium text-[#F16E5E]">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-2 pb-8">
        {schedule.days.length > 1 && (
          <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
            {schedule.days.map((d) => (
              <button
                key={d.dayNo}
                type="button"
                onClick={() => setActiveDay(d.dayNo)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                  activeDay === d.dayNo
                    ? "bg-white text-[#2E7DF2] shadow-sm"
                    : "text-zinc-400"
                }`}
              >
                Day {d.dayNo}
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
                    {s.tag && (
                      <p className="mt-0.5 truncate text-xs text-zinc-400">
                        {s.tag}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStop(s.key)}
                    aria-label="삭제"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-black/5"
                  >
                    <Trash2 size={16} aria-hidden />
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
            <Search size={16} aria-hidden className="shrink-0 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="추가하고 싶은 장소를 검색해보세요"
              className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {query.trim() && (
            <ul className="flex flex-col gap-2">
              {searching && results.length === 0 && (
                <p className="py-2 text-center text-sm text-zinc-400">검색 중...</p>
              )}
              {!searching && results.length === 0 && (
                <p className="py-2 text-center text-sm text-zinc-400">
                  검색 결과가 없어요
                </p>
              )}
              {results.map((p) => {
                const already = activeStops.some((s) => s.placeId === p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-50">
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
    </PageFade>
  );
}
