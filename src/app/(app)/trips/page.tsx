"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageFade from "@/components/ui/PageFade";
import { getSchedules } from "@/lib/api";
import type { ScheduleListItem } from "@/types/api";
import {
    dateRange,
    durationLabel,
    gradientFor,
    placesCount,
    scheduleTitle,
    statusLabel,
    STATUS_STYLE,
} from "@/lib/scheduleFormat";

function NewTripCard() {
    return (
        <Link
            href="/trips/new/date"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-zinc-50"
        >
            <div className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            <p className="mt-3 text-sm font-semibold">새 일정 만들기</p>
            <p className="mt-0.5 text-xs text-zinc-400">3분이면 완성</p>
        </Link>
    );
}

export default function TripsPage() {
    const [trips, setTrips] = useState<ScheduleListItem[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getSchedules()
            .then((data) => !cancelled && setTrips(data.items))
            .catch(() => !cancelled && setError(true));
        return () => {
            cancelled = true;
        };
    }, []);

    const featured = trips?.[0];

    return (
        <PageFade className="flex flex-1 flex-col bg-[#F6F8FC]">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 py-4 backdrop-blur">
                <h1 className="text-2xl font-bold">내 일정</h1>
            </header>

            <div className="flex flex-col gap-6 px-5 pt-2 pb-8">
                {error && (
                    <p className="rounded-2xl bg-white p-5 text-center text-sm text-[#F16E5E] ring-1 ring-black/5">
                        일정을 불러오지 못했어요.
                    </p>
                )}

                {featured && (
                    <section>
                        <h2 className="mb-2 flex items-center gap-1 text-sm text-zinc-500">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                                <path
                                    d="M12 7v5l3 3"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            가장 가까운 여행
                        </h2>
                        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] p-6 text-white">
                            <div className="absolute -top-8 -right-6 size-32 rounded-full bg-white/10" />
                            <div className="absolute top-10 right-10 size-16 rounded-full bg-white/10" />
                            <div className="relative">
                                <span className="text-sm text-white/90">
                                    {dateRange(featured)}
                                </span>
                                <h3 className="mt-2 text-xl font-bold">
                                    {scheduleTitle(featured)}
                                </h3>
                                <p className="mt-1 text-sm text-white/90">
                                    {durationLabel(featured)} · {placesCount(featured)}곳
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
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                            <path
                                                d="M5 12h14M13 6l6 6-6 6"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                <section className="grid grid-cols-2 gap-4">
                    <NewTripCard />
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                        <div className="grid size-11 place-items-center rounded-xl bg-[#FCEAEA] text-[#F16E5E]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path
                                    d="M12 20s-7-4.35-9.5-8.5C.9 8.1 2.5 5 6 5c2 0 3.5 1.2 4 2.4C10.5 6.2 12 5 14 5c3.5 0 5.1 3.1 3.5 6.5C19 15.65 12 20 12 20Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <p className="mt-3 text-sm font-semibold">저장한 장소</p>
                        <p className="mt-0.5 text-xs text-zinc-400">위시리스트</p>
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-zinc-900">
                            모든 일정{" "}
                            <span className="text-[#2E7DF2]">
                                {trips?.length ?? 0}
                            </span>
                        </h2>
                    </div>

                    {trips === null && !error && (
                        <p className="mt-4 text-sm text-zinc-400">불러오는 중...</p>
                    )}

                    {trips !== null && trips.length === 0 && (
                        <div className="mt-4 rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
                            <p className="text-sm text-zinc-500">아직 만든 일정이 없어요.</p>
                            <Link
                                href="/trips/new/date"
                                className="mt-3 inline-block text-sm font-semibold text-[#2E7DF2]"
                            >
                                첫 일정 만들기 →
                            </Link>
                        </div>
                    )}

                    <ul className="mt-4 flex flex-col gap-4">
                        {trips?.map((t, i) => {
                            const status = statusLabel(t.status);
                            return (
                                <li key={t.id}>
                                    <Link
                                        href={`/trips/${t.id}`}
                                        className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-zinc-50"
                                    >
                                        <div
                                            className={`relative flex size-20 shrink-0 items-end rounded-xl bg-linear-to-br p-2 text-[10px] font-semibold text-white ${gradientFor(i)}`}
                                        >
                                            {durationLabel(t)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {scheduleTitle(t)}
                                            </p>
                                            <p className="mt-1 text-xs text-zinc-400">
                                                {dateRange(t)} · {placesCount(t)}곳
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[status] ?? "bg-zinc-100 text-zinc-500"}`}
                                        >
                                            {status}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>
        </PageFade>
    );
}
