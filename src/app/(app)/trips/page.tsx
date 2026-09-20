"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Settings } from "lucide-react";
import { useTripDraft } from "@/store/trip-draft";
import { getSchedules } from "@/lib/api/schedules";
import { ApiError } from "@/lib/api/axios";
import type { ScheduleSummary } from "@/types/api/schedule";

const pageFont = localFont({
    src: "./fonts/PretendardVariable.woff2",
    weight: "45 920",
    display: "swap",
});

const handwritingFont = localFont({
    src: "./fonts/NanumBrushScript-Regular.ttf",
    weight: "400",
    display: "swap",
});

const PLANNED_COVERS = [
    "/trips-covers/cover-coastal-temple.png",
    "/trips-covers/cover-hillside.png",
];
const ZERO_PLAN_COVERS = [
    "/trips-covers/cover-gwangalli.png",
    "/trips-covers/cover-harbor-market.png",
];

function PlanningCalendarIcon() {
    return (
        <svg className="size-[clamp(40px,9.4vw,48px)] shrink-0" viewBox="0 0 44 44" fill="none" aria-hidden="true">
            <rect x="3" y="8" width="34" height="32" rx="5" fill="#E0F0FF" />
            <path d="M3 13a5 5 0 0 1 5-5h24a5 5 0 0 1 5 5v5H3v-5Z" fill="#3F83E9" />
            <path d="M11 4v10M29 4v10" stroke="#2C72D5" strokeWidth="4" strokeLinecap="round" />
            <path d="M10 23h6v6h-6zm10 0h6v6h-6zM10 33h6v5h-6z" fill="#9CCBFF" />
            <circle cx="34" cy="34" r="10" fill="#3F83E9" />
            <path d="M34 29v10m-5-5h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function ZeroPlanSignpostIcon() {
    return (
        <svg className="h-[clamp(48px,11.3vw,58px)] w-[clamp(44px,10.3vw,53px)] shrink-0" viewBox="0 0 44 48" fill="none" aria-hidden="true">
            <defs>
                <linearGradient id="signpost-gold" x1="4" y1="0" x2="40" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FBD27F" />
                    <stop offset="1" stopColor="#EBA843" />
                </linearGradient>
            </defs>
            <path d="M22 3v42" stroke="#D99334" strokeWidth="5" strokeLinecap="round" />
            <path d="M8 12h24l8 7-8 7H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" fill="url(#signpost-gold)" />
            <path d="M36 29H12l-8 7 8 7h24a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3Z" fill="url(#signpost-gold)" />
        </svg>
    );
}

type TripStatus = "여행중" | "진행 임박" | "예정" | "완료";

const STATUS_STYLE: Record<TripStatus, string> = {
    여행중: "bg-[#E6F7F3] text-[#17B89B]",
    "진행 임박": "bg-[#E6F7F3] text-[#17B89B]",
    예정: "bg-[#E8F1FE] text-[#2E7DF2]",
    완료: "bg-[#FFE8E5] text-[#D74432]",
};

function getScheduleCover(schedule: ScheduleSummary) {
    // These generated covers decorate the cards; they do not represent scheduled stops.
    const covers = schedule.scheduleType === "SPONTANEOUS" ? ZERO_PLAN_COVERS : PLANNED_COVERS;
    const variant = [...schedule.id].reduce((total, character) => total + character.charCodeAt(0), 0);
    return covers[variant % covers.length];
}

function parseDate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
}

function startOfDay(date: Date) {
    const today = new Date(date);
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

function getDateStatus(schedule: ScheduleSummary, today: Date): TripStatus {
    const end = parseDate(schedule.endDate);
    if (diffDays(today, end) < 0) return "완료";
    const start = parseDate(schedule.startDate);
    if (diffDays(today, start) <= 7) return "진행 임박";
    return "예정";
}

function parseDateTime(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getStatus(schedule: ScheduleSummary, now: Date): TripStatus {
    if (schedule.scheduleType === "SPONTANEOUS") {
        const startAt = parseDateTime(schedule.startAt);
        const endAt =
            parseDateTime(schedule.estimatedReturnAt) ?? parseDateTime(schedule.returnBy);
        const timestampsAreOrdered = !startAt || !endAt || startAt.getTime() <= endAt.getTime();

        if (endAt && timestampsAreOrdered && now.getTime() >= endAt.getTime()) return "완료";

        if (startAt && endAt && timestampsAreOrdered) {
            if (now.getTime() < startAt.getTime()) return "예정";
            return "여행중";
        }
    }

    return getDateStatus(schedule, startOfDay(now));
}

function getScheduleTitle(schedule: ScheduleSummary) {
    return schedule.scheduleType === "SPONTANEOUS" ? "제로플랜" : schedule.styleSummary;
}

function getFeaturedStatusLabel(schedule: ScheduleSummary, now: Date) {
    const status = getStatus(schedule, now);
    if (
        schedule.scheduleType === "SPONTANEOUS" &&
        (status === "여행중" || status === "완료")
    ) {
        return status;
    }

    const dday = diffDays(startOfDay(now), parseDate(schedule.startDate));
    return dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : "여행중";
}

export default function TripsPage() {
    const router = useRouter();
    const { resetDraft } = useTripDraft();

    const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());

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

    const today = useMemo(() => startOfDay(now), [now]);

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

    return (
        <div className={`${pageFont.className} flex w-full min-w-0 flex-1 flex-col overflow-x-clip bg-[#F8FBFF] text-[#14233F]`}>
            <header className="relative aspect-[2/1] min-h-[166px] shrink-0 overflow-hidden bg-white">
                <Image
                    src="/trips-covers/header-busan.png"
                    alt=""
                    fill
                    loading="eager"
                    sizes="(max-width: 512px) 100vw, 512px"
                    className="object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-linear-to-b from-transparent via-white/40 to-[#F8FBFF]" />
                <h1 className="relative pt-[clamp(45px,10.5vw,54px)] text-center text-[clamp(24px,5.65vw,28px)] font-extrabold tracking-tight">내 일정</h1>
                <Settings className="absolute top-[clamp(47px,11vw,56px)] right-[clamp(24px,5.6vw,29px)] text-[#61748E]" size={23} strokeWidth={1.7} aria-hidden />
                <span
                    aria-hidden
                    className={`${handwritingFont.className} absolute top-[clamp(75px,17.6vw,90px)] left-[clamp(20px,4.7vw,24px)] origin-left -rotate-6 scale-x-[1.2] text-[clamp(24px,5.65vw,29px)] leading-[0.9] text-[#6A9FE1] drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]`}
                >
                    언제나,<br />부산으로
                </span>
                <svg className="absolute top-[clamp(110px,25.8vw,132px)] left-[clamp(32px,7.5vw,38px)] h-4 w-[clamp(90px,21vw,108px)] -rotate-6 text-[#6A9FE1]" viewBox="0 0 90 16" fill="none" aria-hidden="true">
                    <path d="M2 10c15-7 24-7 36-1 8 4 12 3 22-3 9-5 16-5 28-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span
                    aria-hidden
                    className={`${handwritingFont.className} absolute top-[clamp(84px,19.7vw,101px)] right-[clamp(28px,6.6vw,34px)] origin-right rotate-6 scale-x-[1.3] text-right text-[clamp(23px,5.4vw,27px)] leading-[0.9] text-[#6A9FE1] drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]`}
                >
                    좋은 곳이<br />더 많은 부산
                </span>
                <svg className="absolute top-[clamp(76px,17.8vw,92px)] right-[clamp(90px,21vw,108px)] h-3 w-8 text-[#6A9FE1]" viewBox="0 0 32 12" fill="none" aria-hidden="true">
                    <path d="M2 9c7-5 10-5 17-2 4 2 7 1 11-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </header>

            {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20">
                    <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
                    <p className="text-sm text-zinc-400">일정을 불러오는 중...</p>
                </div>
            ) : error ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            ) : (
                <div className="flex w-full min-w-0 flex-col gap-[clamp(16px,3.75vw,20px)] px-[clamp(19px,4.46vw,23px)] pb-8">
                    {featured && (
                        <section className="relative z-[1] min-w-0 -mt-[clamp(54px,12.7vw,64px)]">
                            <h2 className="mb-[clamp(12px,2.8vw,14px)] text-[clamp(16px,3.75vw,18px)] font-extrabold tracking-tight">가장 가까운 여행</h2>
                            <div className="relative w-full min-w-0 aspect-[1.94] min-h-[202px] overflow-hidden rounded-[23px] bg-white shadow-[0_8px_28px_rgba(44,112,191,0.09)]">
                                <div className="absolute inset-y-0 right-0 w-[52%]" style={{ clipPath: "ellipse(100% 84% at 100% 50%)" }}>
                                    <Image
                                        src="/trips-covers/featured-lighthouse.png"
                                        alt=""
                                        fill
                                        sizes="(max-width: 512px) 52vw, 266px"
                                        className="object-cover object-right brightness-110 saturate-75"
                                    />
                                </div>
                                <span
                                    aria-hidden
                                    className={`${handwritingFont.className} absolute top-[clamp(42px,9.86vw,50px)] right-[clamp(48px,11.3vw,58px)] z-[1] w-[clamp(112px,26.3vw,134px)] origin-right -rotate-6 scale-x-[1.2] text-center text-[clamp(21px,4.93vw,25px)] leading-[0.9] text-[#0F5A9F] drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)]`}
                                >
                                    바다,<br />그리고 부산
                                </span>
                                <svg className="absolute top-[clamp(87px,20.4vw,104px)] right-[clamp(48px,11.3vw,58px)] z-[1] h-4 w-[clamp(90px,21.1vw,108px)] -rotate-6 text-[#0F5A9F]" viewBox="0 0 90 16" fill="none" aria-hidden="true">
                                    <path d="M2 10c18-8 29-8 45-1 9 4 14 3 24-4 6-4 12-4 17-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <div className="relative z-[1] flex h-full flex-col items-start p-[clamp(16px,3.75vw,20px)]">
                                    <span className="rounded-full bg-[#FFE7E4] px-[clamp(10px,2.35vw,12px)] py-1 text-[clamp(10px,2.35vw,12px)] font-bold text-[#D74432]">
                                        {getFeaturedStatusLabel(featured, now)}
                                    </span>
                                    <span className="mt-2 text-[clamp(13px,3.05vw,15px)] font-semibold text-[#64758E]">
                                        {formatDateLabel(featured.startDate, featured.endDate)}
                                    </span>
                                    <h3 className="mt-1 max-w-[52%] truncate text-[clamp(16px,3.75vw,19px)] font-extrabold tracking-tight">
                                        {getScheduleTitle(featured)}
                                    </h3>
                                    <p className="mt-1 text-[clamp(12px,2.8vw,13px)] font-medium text-[#64758E]">
                                        {formatDuration(featured.dayCount)} · {featured.stopCount}곳
                                    </p>
                                    <Link
                                        href={`/trips/${featured.id}`}
                                        className="mt-auto flex w-[clamp(140px,32.9vw,164px)] max-w-[46%] items-center justify-center gap-1.5 rounded-full bg-[#E4F4FF] py-[clamp(7px,1.64vw,8px)] text-[clamp(12px,2.8vw,14px)] font-bold text-[#1267D0] transition-colors hover:bg-[#D5ECFF]"
                                    >
                                        일정 보기 <ArrowRight className="size-[clamp(16px,3.75vw,18px)]" strokeWidth={2.2} aria-hidden />
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="grid w-full min-w-0 grid-cols-2 gap-[clamp(10px,2.35vw,12px)]" aria-label="새 일정 만들기">
                        <button
                            type="button"
                            onClick={() => { resetDraft(); router.push("/trips/new/date"); }}
                            className="flex min-w-0 aspect-[2.1] min-h-[91px] cursor-pointer items-center gap-[clamp(10px,2.35vw,12px)] overflow-hidden rounded-[20px] bg-linear-to-r from-[#EAF6FF] to-[#F5FBFF] px-[clamp(10px,2.35vw,12px)] text-left transition-colors hover:from-[#E0F1FF] max-[359px]:flex-col max-[359px]:justify-center max-[359px]:gap-1"
                        >
                            <PlanningCalendarIcon />
                            <span className="min-w-0 flex-1">
                                <span className="block whitespace-nowrap text-xs font-bold min-[390px]:text-[clamp(13px,3.05vw,15px)]">일정 계획하기</span>
                                <span className="mt-1 block whitespace-nowrap text-[10px] text-[#64758E] min-[390px]:text-[clamp(11px,2.58vw,13px)]">3분이면 완성</span>
                            </span>
                            <ChevronRight className="hidden size-[clamp(15px,3.52vw,18px)] shrink-0 text-[#64758E] min-[430px]:block" aria-hidden />
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/spontaneous")}
                            className="flex min-w-0 aspect-[2.1] min-h-[91px] cursor-pointer items-center gap-[clamp(10px,2.35vw,12px)] overflow-hidden rounded-[20px] bg-linear-to-r from-[#FFF8EB] to-[#FFFDF8] px-[clamp(10px,2.35vw,12px)] text-left transition-colors hover:from-[#FFF0D9] max-[359px]:flex-col max-[359px]:justify-center max-[359px]:gap-1"
                        >
                            <ZeroPlanSignpostIcon />
                            <span className="min-w-0 flex-1">
                                <span className="block whitespace-nowrap text-xs font-bold min-[390px]:text-[clamp(13px,3.05vw,15px)]">제로플랜</span>
                                <span className="mt-1 block whitespace-nowrap text-[10px] text-[#64758E] min-[390px]:text-[clamp(11px,2.58vw,13px)]">지금 바로 출발</span>
                            </span>
                            <ChevronRight className="hidden size-[clamp(15px,3.52vw,18px)] shrink-0 text-[#64758E] min-[430px]:block" aria-hidden />
                        </button>
                    </section>

                    <section className="min-w-0 pt-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[clamp(17px,4vw,20px)] font-extrabold tracking-tight">
                                모든 일정 <span className="text-[#2E7DF2]">{sorted.length}</span>
                            </h2>
                            <span className="flex items-center gap-1 text-[clamp(12px,2.8vw,14px)] font-medium text-[#64758E]">
                                전체 보기 <ChevronRight className="size-[clamp(16px,3.75vw,19px)]" strokeWidth={1.9} aria-hidden />
                            </span>
                        </div>

                        {sorted.length === 0 ? (
                            <p className="py-12 text-center text-sm text-zinc-400">아직 만든 일정이 없어요</p>
                        ) : (
                            <ul className="mt-3 flex flex-col gap-3">
                                {sorted.map((t) => (
                                    <li key={t.id}>
                                        <Link
                                            href={`/trips/${t.id}`}
                                             className="relative flex aspect-[3.58] min-h-[110px] items-center gap-[clamp(16px,3.75vw,19px)] overflow-hidden rounded-[20px] bg-white p-[clamp(10px,2.35vw,12px)] pl-[clamp(16px,3.75vw,19px)] shadow-[0_5px_20px_rgba(44,112,191,0.08)] transition-colors hover:bg-[#F8FBFF]"
                                        >
                                            <span className={`absolute inset-y-0 left-0 w-[5px] ${t.scheduleType === "SPONTANEOUS" ? "bg-[#F48779]" : "bg-[#2E7DF2]"}`} />
                                             <span className="relative aspect-square w-[23%] min-w-[80px] max-w-[110px] shrink-0 overflow-hidden rounded-[13px]">
                                                <Image
                                                    src={getScheduleCover(t)}
                                                    alt=""
                                                    fill
                                                     sizes="(max-width: 512px) 23vw, 110px"
                                                    className="object-cover"
                                                />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                 <span className="block truncate text-[clamp(15px,3.52vw,17px)] font-bold">{getScheduleTitle(t)}</span>
                                                 <span className="mt-1 block text-[clamp(12px,2.8vw,14px)] text-[#64758E]">
                                                    {formatDateLabel(t.startDate, t.endDate)} · {t.stopCount}곳
                                                </span>
                                                 <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[clamp(11px,2.58vw,12px)] font-semibold ${STATUS_STYLE[getStatus(t, now)]}`}>
                                                    {getStatus(t, now)}
                                                </span>
                                            </span>
                                             <ChevronRight className="size-[clamp(19px,4.46vw,23px)] shrink-0 text-[#64758E]" strokeWidth={1.8} aria-hidden />
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
