"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ArrowRight, Plus, Zap } from "lucide-react";
import { useTripDraft } from "@/store/trip-draft";
import { getSchedules } from "@/lib/api/schedules";
import { ApiError } from "@/lib/api/axios";
import type { ScheduleSummary } from "@/types/api/schedule";

const GRADIENTS = [
    "from-[#2E7DF2] to-[#17B89B]",
    "from-[#F7A18E] to-[#F16E5E]",
    "from-[#8B7DF2] to-[#5B5EE8]",
    "from-[#5AA9F0] to-[#3B7DE0]",
];

type TripStatus = "진행 임박" | "예정" | "완료";

const STATUS_STYLE: Record<TripStatus, string> = {
    "진행 임박": "bg-[#E6F7F3] text-[#17B89B]",
    예정: "bg-[#E8F1FE] text-[#2E7DF2]",
    완료: "bg-zinc-100 text-zinc-500",
};

function parseDate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function diffDays(from: Date, to: Date) {
    return Math.round((to.getTime() - from.getTime()) / 86400000);
}

function formatDateLabel(startDate: string, endDate: string) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const startLabel = `${start.getMonth() + 1}.${start.getDate()}`;
    if (startDate === endDate) return startLabel;
    const endLabel = `${end.getMonth() + 1}.${end.getDate()}`;
    return `${startLabel} - ${endLabel}`;
}

function formatDuration(dayCount: number) {
    if (dayCount <= 1) return "당일";
    return `${dayCount - 1}박${dayCount}일`;
}

function getStatus(schedule: ScheduleSummary, today: Date): TripStatus {
    const end = parseDate(schedule.endDate);
    if (diffDays(today, end) < 0) return "완료";
    const start = parseDate(schedule.startDate);
    if (diffDays(today, start) <= 7) return "진행 임박";
    return "예정";
}

export default function TripsPage() {
    const router = useRouter();
    const { resetDraft } = useTripDraft();

    const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
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

    const today = useMemo(() => startOfToday(), []);

    const sorted = useMemo(
        () =>
            [...schedules].sort(
                (a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime(),
            ),
        [schedules],
    );

    const featured = useMemo(() => {
        if (sorted.length === 0) return null;
        const upcoming = sorted.find((s) => diffDays(today, parseDate(s.endDate)) >= 0);
        return upcoming ?? sorted[sorted.length - 1];
    }, [sorted, today]);

    const featuredDday = featured ? diffDays(today, parseDate(featured.startDate)) : 0;
    const featuredDdayLabel =
        featuredDday > 0 ? `D-${featuredDday}` : featuredDday === 0 ? "D-DAY" : "여행중";

    return (
        <div className="flex flex-1 flex-col bg-[#F6F8FC]">
            <header className="sticky top-0 z-10 flex items-center justify-center bg-white px-5 py-4 backdrop-blur">
                <h1 className="text-base font-semibold">내 일정</h1>
            </header>

            {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
                    <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
                    <p className="text-sm text-zinc-400">일정을 불러오는 중...</p>
                </div>
            ) : error ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 px-6 text-center">
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            ) : (
            <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
                {featured && (
                <section>
                    <h2 className="mb-2 flex items-center gap-1 text-sm text-zinc-500">
                        <Clock size={14} strokeWidth={1.8} aria-hidden />
                        가장 가까운 여행
                    </h2>
                    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] p-6 text-white">
                        <div className="absolute -top-8 -right-6 size-32 rounded-full bg-white/10" />
                        <div className="absolute top-10 right-10 size-16 rounded-full bg-white/10" />
                        <div className="relative">
                            <span className="inline-block rounded-full bg-[#F16E5E] px-2.5 py-1 text-xs font-bold">
                                {featuredDdayLabel}
                            </span>
                            <span className="ml-2 text-sm text-white/90">
                                {formatDateLabel(featured.startDate, featured.endDate)}
                            </span>
                            <h3 className="mt-2 text-xl font-bold">
                                {featured.styleSummary}
                            </h3>
                            <p className="mt-1 text-sm text-white/90">
                                {formatDuration(featured.dayCount)} · {featured.stopCount}곳
                            </p>

                            <div className="mt-5 flex items-center gap-2">
                                <Link
                                    href={`/trips/${featured.id}`}
                                    className="flex-1 rounded-full bg-white py-2.5 text-center text-sm font-semibold text-zinc-900 transition-transform active:scale-95"
                                >
                                    일정 보기
                                </Link>
                                <Link
                                    href={`/trips/${featured.id}`}
                                    aria-label="일정 상세로 이동"
                                    className="grid size-10 shrink-0 place-items-center rounded-full bg-white/20 hover:bg-white/30"
                                >
                                    <ArrowRight size={18} strokeWidth={2} aria-hidden />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
                )}

                <section className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => { resetDraft(); router.push("/trips/new/date"); }}
                        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 text-left transition-colors hover:bg-zinc-50 cursor-pointer"
                    >
                        <div className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white">
                            <Plus size={20} strokeWidth={2} aria-hidden />
                        </div>
                        <p className="mt-3 text-sm font-semibold">
                            일정 계획하기
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                            3분이면 완성
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/spontaneous")}
                        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 text-left transition-colors hover:bg-zinc-50 cursor-pointer"
                    >
                        <div className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-[#F7A18E] to-[#F16E5E] text-white">
                            <Zap size={20} strokeWidth={2} aria-hidden />
                        </div>
                        <p className="mt-3 text-sm font-semibold">
                            즉흥여행
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                            지금 바로 출발
                        </p>
                    </button>
                </section>

                <section>
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-zinc-900">
                            모든 일정{" "}
                            <span className="text-[#2E7DF2]">
                                {sorted.length}
                            </span>
                        </h2>
                        <button
                            type="button"
                            className="text-xs font-medium text-zinc-400 cursor-pointer"
                        >
                            전체 보기
                        </button>
                    </div>

                    {sorted.length === 0 ? (
                        <p className="py-12 text-center text-sm text-zinc-400">아직 만든 일정이 없어요</p>
                    ) : (
                    <ul className="mt-4 flex flex-col gap-4">
                        {sorted.map((t, i) => (
                            <li key={t.id}>
                                <Link
                                    href={`/trips/${t.id}`}
                                    className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-zinc-50"
                                >
                                    <div
                                        className={`relative flex size-20 shrink-0 items-end rounded-xl bg-linear-to-br p-2 text-[10px] font-semibold text-white ${GRADIENTS[i % GRADIENTS.length]}`}
                                    >
                                        {formatDuration(t.dayCount)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {t.styleSummary}
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-400">
                                            {formatDateLabel(t.startDate, t.endDate)} · {t.stopCount}곳
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[getStatus(t, today)]}`}
                                    >
                                        {getStatus(t, today)}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    )}
                </section>
            </div>
            )}
        </div>
    );
}
