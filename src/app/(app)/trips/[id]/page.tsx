"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { getItinerary } from "@/mocks/itinerary";
import NaverMap from "@/components/NaverMap";
import V2ScheduleDetail from "@/components/V2ScheduleDetail";

function LegacyTripDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const itinerary = getItinerary(params.id);

    const [dayIndex, setDayIndex] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const viewportRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);
    const [animate, setAnimate] = useState(false);

    const day = itinerary[dayIndex];
    const places = day.places;
    const lastIndex = Math.max(places.length - 1, 1);
    const progress = (activeIndex / lastIndex) * 100;

    const route = places.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        order: p.order,
        color: p.color,
    }));
    const mapCenter = { lat: places[0].lat, lng: places[0].lng };

    useEffect(() => {
        function recalc() {
            const vp = viewportRef.current;
            const track = vp?.firstElementChild as HTMLElement | null;
            const card = track?.firstElementChild as HTMLElement | null;
            if (!vp || !card) return;
            const step = card.offsetWidth + 12;
            setOffset(
                vp.offsetWidth / 2 - activeIndex * step - card.offsetWidth / 2,
            );
        }
        recalc();
        const raf = requestAnimationFrame(() => setAnimate(true));
        window.addEventListener("resize", recalc);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", recalc);
        };
    }, [activeIndex, places]);

    function goTo(index: number) {
        setActiveIndex(Math.min(places.length - 1, Math.max(0, index)));
    }

    function selectDay(index: number) {
        setDayIndex(index);
        setActiveIndex(0);
    }

    return (
        <div className="flex flex-1 flex-col">
            <header className="flex items-center gap-2 px-5 pt-4 pb-2">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="뒤로 가기"
                    className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
                >
                    ‹
                </button>
                <h1 className="flex-1 text-center text-lg font-bold">
                    Day {day.day}
                </h1>
                <button
                    type="button"
                    onClick={() => router.push(`/trips/${params.id}/edit`)}
                    aria-label="일정 수정"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
                >
                    <Pencil size={18} />
                </button>
                <button
                    type="button"
                    aria-label="공유"
                    onClick={() => {
                        if (
                            typeof navigator !== "undefined" &&
                            navigator.share
                        ) {
                            navigator
                                .share({ title: `Day ${day.day} 일정` })
                                .catch(() => {});
                        }
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                    >
                        <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8" />
                        <path
                            d="M8.6 10.5 15.4 6.5M8.6 13.5 15.4 17.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </header>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-6">
                <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
                    {itinerary.map((d, i) => (
                        <button
                            key={d.day}
                            type="button"
                            onClick={() => selectDay(i)}
                            className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                                i === dayIndex
                                    ? "bg-linear-to-br from-[#2E7DF2] to-[#17B89B] font-bold text-white shadow-sm"
                                    : "text-zinc-400"
                            }`}
                        >
                            Day {d.day}
                        </button>
                    ))}
                </div>

                <div className="relative shrink-0">
                    <NaverMap
                        center={mapCenter}
                        route={route}
                        className="h-72 w-full overflow-hidden rounded-3xl"
                    />
                    <button
                        type="button"
                        aria-label="현재 위치"
                        className="absolute right-3 bottom-3 z-10 grid size-11 place-items-center rounded-full bg-white shadow-lg"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden
                        >
                            <circle cx="12" cy="12" r="3" stroke="#2E7DF2" strokeWidth="1.8" />
                            <path
                                d="M12 2v3M12 19v3M2 12h3M19 12h3"
                                stroke="#2E7DF2"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">오늘의 코스</h2>
                    <p className="text-sm text-zinc-400">
                        {places.length}곳 · 약 {day.distanceKm}km
                    </p>
                </div>

                <div className="relative">
                    <div ref={viewportRef} className="-mx-5 overflow-hidden py-1">
                        <div
                            className={`flex gap-3 ${animate ? "transition-transform duration-300 ease-out" : ""}`}
                            style={{ transform: `translateX(${offset}px)` }}
                        >
                            {places.map((p, i) => (
                                <div
                                    key={p.id}
                                    onClick={() => goTo(i)}
                                    className={`relative flex h-48 w-[80%] shrink-0 cursor-pointer flex-col justify-end overflow-hidden rounded-3xl bg-linear-to-br p-5 text-white transition-opacity duration-300 ${p.gradient} ${i === activeIndex ? "" : "opacity-60"}`}
                                >
                                    <span className="absolute top-4 left-4 grid size-7 place-items-center rounded-full bg-white text-sm font-bold text-zinc-900">
                                        {p.order}
                                    </span>
                                    <span className="absolute top-4 right-4 rounded-full bg-black/30 px-2.5 py-1 text-sm font-semibold">
                                        {p.time}
                                    </span>
                                    <p className="text-lg font-bold">{p.title}</p>
                                    <p className="mt-1 text-sm text-white/90">
                                        {p.subtitle}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => goTo(activeIndex - 1)}
                        disabled={activeIndex === 0}
                        aria-label="이전 장소"
                        className="absolute top-1/2 left-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl leading-none text-zinc-700 shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        onClick={() => goTo(activeIndex + 1)}
                        disabled={activeIndex === places.length - 1}
                        aria-label="다음 장소"
                        className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl leading-none text-zinc-700 shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
                    >
                        ›
                    </button>
                </div>

                <div className="flex justify-center gap-1.5">
                    {places.map((p, i) => (
                        <span
                            key={p.id}
                            className={`h-1.5 rounded-full transition-all ${
                                i === activeIndex
                                    ? "w-5 bg-[#2E7DF2]"
                                    : "w-1.5 bg-zinc-200"
                            }`}
                        />
                    ))}
                </div>

                <div className="mt-2 px-1">
                    <div className="relative h-2 rounded-full bg-zinc-200">
                        <div
                            className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-[#2E7DF2] to-[#17B89B]"
                            style={{ width: `${progress}%` }}
                        />
                        <div
                            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#2E7DF2] bg-white shadow-md"
                            style={{ left: `${progress}%` }}
                        />
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-zinc-400">
                        {places.map((p, i) => (
                            <span
                                key={p.id}
                                className={
                                    i === activeIndex
                                        ? "font-bold text-[#2E7DF2]"
                                        : ""
                                }
                            >
                                {p.time}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TripDetailPage() {
    const params = useParams<{ id: string }>();
    if (!/^\d+$/.test(params.id)) return <V2ScheduleDetail scheduleId={params.id} />;
    return <LegacyTripDetailPage />;
}
