"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSchedules } from "@/lib/api/schedules";
import { ApiError } from "@/lib/api/axios";
import type { ScheduleSummary } from "@/types/api/schedule";
import { getStatus, parseDate } from "@/lib/trips/schedule-helpers";
import ScheduleListItem from "@/components/trips/ScheduleListItem";

const FILTERS = ["전체", "예정", "진행중", "완료"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(schedule: ScheduleSummary, now: Date, filter: Filter) {
    if (filter === "전체") return true;
    const status = getStatus(schedule, now);
    if (filter === "진행중") return status === "여행중";
    if (filter === "예정") return status === "예정" || status === "진행 임박";
    return status === "완료";
}

export default function AllSchedulesPage() {
    const router = useRouter();

    const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());
    const [filter, setFilter] = useState<Filter>("전체");

    useEffect(() => {
        let cancelled = false;
        getSchedules()
            .then((res) => {
                if (cancelled) return;
                setSchedules(res.items);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err instanceof ApiError ? err.payload.message : "일정을 불러오지 못했습니다.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const timerId = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(timerId);
    }, []);

    const sorted = useMemo(
        () =>
            [...schedules].sort(
                (a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime(),
            ),
        [schedules],
    );

    const filtered = useMemo(
        () => sorted.filter((schedule) => matchesFilter(schedule, now, filter)),
        [sorted, now, filter],
    );

    return (
        <div className="flex flex-1 flex-col bg-[#F8FBFF] text-[#14233F]">
            <header className="flex items-center gap-2 border-b border-black/5 bg-white px-4 py-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
                >
                    <ChevronLeft size={22} />
                </button>
                <h1 className="flex-1 text-center text-base font-medium">모든 일정</h1>
                <div className="size-8" />
            </header>

            <div className="flex gap-2 overflow-x-auto border-b border-black/5 bg-white px-4 py-2.5">
                {FILTERS.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setFilter(option)}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            filter === option
                                ? "bg-[#2E7DF2] text-white"
                                : "bg-[#F1F5FB] text-[#64758E] hover:bg-[#E4EDFB]"
                        }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20">
                    <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
                    <p className="text-sm text-zinc-400">일정을 불러오는 중...</p>
                </div>
            ) : error ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            ) : sorted.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-400">아직 만든 일정이 없어요</p>
            ) : filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-zinc-400">해당하는 일정이 없어요</p>
            ) : (
                <ul className="flex flex-col gap-3 px-[clamp(19px,4.46vw,23px)] py-4">
                    {filtered.map((schedule) => (
                        <ScheduleListItem key={schedule.id} schedule={schedule} now={now} />
                    ))}
                </ul>
            )}
        </div>
    );
}
