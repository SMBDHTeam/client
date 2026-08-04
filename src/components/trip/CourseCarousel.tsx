"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, MapPin } from "lucide-react";
import type { ScheduleDay, ScheduleStop, Transit } from "@/types/api";
import {
    fareLabel,
    gradientFor,
    hhmm,
    mealLabel,
    stopColor,
    stripHtml,
    transitModeMeta,
} from "@/utils/scheduleFormat";

type CarouselItem =
    | {
          kind: "endpoint";
          role: "start" | "end";
          name: string;
          time: string;
          transit: Transit | null;
      }
    | { kind: "stop"; stop: ScheduleStop; index: number };

function TransitPanel({ transit }: { transit: Transit | null }) {
    if (!transit) return null;
    const fare = fareLabel(transit.fareAmount);

    return (
        <div className="rounded-2xl bg-zinc-50 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-semibold text-zinc-500">
                    {transit.originName} → {transit.destinationName}
                </p>
                <p className="shrink-0 text-xs font-bold text-[#2E7DF2]">
                    총 {transit.totalMinutes}분
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
                {transit.segments.map((s, i) => {
                    const meta = transitModeMeta(s.mode);
                    const Icon = meta.icon;
                    return (
                        <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span className="text-zinc-300">›</span>}
                            <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-sm ring-1 ring-black/5">
                                <Icon className="size-3.5" style={{ color: meta.color }} aria-hidden />
                                {s.mode === "WALK"
                                    ? `도보 ${s.durationMinutes}분`
                                    : `${s.lineName ?? meta.label} ${s.durationMinutes}분`}
                            </span>
                        </span>
                    );
                })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
                {transit.walkMinutes > 0 && <span>도보 {transit.walkMinutes}분</span>}
                {transit.transferCount > 0 && <span>환승 {transit.transferCount}회</span>}
                {transit.waitMinutes > 0 && <span>대기 {transit.waitMinutes}분</span>}
                {fare && <span>{fare}</span>}
            </div>
            {transit.warnings.length > 0 && (
                <p className="mt-1.5 text-[11px] text-[#E4820B]">
                    ⚠ {transit.warnings.join(" · ")}
                </p>
            )}
        </div>
    );
}

function CourseCard({
    item,
    active,
    onSelect,
    onDetail,
    cardRef,
}: {
    item: CarouselItem;
    active: boolean;
    onSelect: () => void;
    onDetail?: () => void;
    cardRef: (el: HTMLDivElement | null) => void;
}) {
    if (item.kind === "endpoint") {
        return (
            <div
                ref={cardRef}
                onClick={onSelect}
                className={`relative flex w-[78%] shrink-0 snap-center flex-col overflow-hidden rounded-3xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] shadow-sm ring-1 ring-black/5 transition-all ${
                    active ? "scale-100" : "scale-[0.97] opacity-90"
                }`}
            >
                {item.role === "start" ? (
                    <Flag aria-hidden className="pointer-events-none absolute inset-0 m-auto size-28 text-white/15" />
                ) : (
                    <MapPin aria-hidden className="pointer-events-none absolute inset-0 m-auto size-28 text-white/15" />
                )}

                <div className="relative flex flex-1 flex-col justify-end gap-1 p-4 pt-8">
                    <span className="w-fit rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">
                        {item.role === "start" ? "출발" : "도착"}
                    </span>
                    <p className="text-lg font-bold text-white">{item.name}</p>
                    <p className="text-xs font-medium text-white/70">{hhmm(item.time)}</p>
                </div>
            </div>
        );
    }

    const { stop, index } = item;
    const { place } = stop;
    const meal = mealLabel(stop.mealTimeSlot);
    const hours = stripHtml(place.operatingInfo?.openingHoursText);
    const closed = stripHtml(place.operatingInfo?.closedDaysText);

    return (
        <div
            ref={cardRef}
            onClick={onSelect}
            className={`w-[78%] shrink-0 snap-center overflow-hidden rounded-3xl bg-white shadow-sm ring-1 transition-all ${
                active ? "scale-100 ring-2 ring-[#2E7DF2]" : "scale-[0.97] opacity-90 ring-black/5"
            }`}
        >
            <div
                className={`relative flex h-44 flex-col justify-between p-3 ${
                    !place.primaryImageUrl ? `bg-linear-to-br ${gradientFor(index)}` : ""
                }`}
                style={
                    place.primaryImageUrl
                        ? {
                              backgroundImage: `url(${place.primaryImageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                          }
                        : undefined
                }
            >
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/30" />

                <div className="relative flex items-start justify-between">
                    <span
                        className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white shadow"
                        style={{ background: stopColor(index) }}
                    >
                        {stop.order}
                    </span>
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {hhmm(stop.arriveAt)} – {hhmm(stop.departAt)}
                    </span>
                </div>

                <div className="relative flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        <p className="truncate text-base font-bold text-white">
                            {place.name}
                        </p>
                        {place.categoryLabel && (
                            <p className="truncate text-xs text-white/75">
                                {place.categoryLabel}
                            </p>
                        )}
                    </div>
                    {meal && (
                        <span className="shrink-0 rounded-full bg-[#FFF3E0] px-2 py-0.5 text-[10px] font-bold text-[#E4820B]">
                            {meal}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-500">
                        체류 {stop.stayMinutes}분
                    </p>
                    {onDetail && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDetail();
                            }}
                            className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-200"
                        >
                            상세보기
                        </button>
                    )}
                </div>

                {(hours || closed) && (
                    <div className="text-xs text-zinc-500">
                        {hours && (
                            <p className="flex gap-1.5">
                                <span className="shrink-0 text-zinc-400">운영</span>
                                <span className="min-w-0 truncate">{hours}</span>
                            </p>
                        )}
                        {closed && (
                            <p className="mt-0.5 flex gap-1.5">
                                <span className="shrink-0 text-zinc-400">휴무</span>
                                <span className="min-w-0 truncate">{closed}</span>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CourseCarousel({
    day,
    stops,
    onSelectOrder,
    onDetail,
}: {
    day: ScheduleDay;
    stops: ScheduleStop[];
    onSelectOrder: (order: number | undefined) => void;
    onDetail: (placeId: number) => void;
}) {
    const items = useMemo<CarouselItem[]>(
        () => [
            {
                kind: "endpoint",
                role: "start",
                name: day.startLocation.name,
                time: day.startTime,
                transit: null,
            },
            ...stops.map((stop, index) => ({ kind: "stop" as const, stop, index })),
            {
                kind: "endpoint",
                role: "end",
                name: day.endLocation.name,
                time: day.endTime,
                transit: day.finalTransit,
            },
        ],
        [day, stops],
    );

    const scrollRef = useRef<HTMLDivElement>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const activeItem = items[activeIndex];
    const activeTransit =
        activeItem.kind === "stop" ? activeItem.stop.inboundTransit : activeItem.transit;

    function selectIndex(idx: number, scroll: boolean) {
        setActiveIndex(idx);
        const item = items[idx];
        onSelectOrder(item.kind === "stop" ? item.stop.order : undefined);
        if (scroll) {
            cardRefs.current[idx]?.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            });
        }
    }

    function handleScroll() {
        const container = scrollRef.current;
        if (!container) return;
        const center = container.scrollLeft + container.clientWidth / 2;
        let closest = 0;
        let closestDist = Infinity;
        cardRefs.current.forEach((el, i) => {
            if (!el) return;
            const mid = el.offsetLeft + el.offsetWidth / 2;
            const dist = Math.abs(mid - center);
            if (dist < closestDist) {
                closestDist = dist;
                closest = i;
            }
        });
        if (closest !== activeIndex) {
            setActiveIndex(closest);
            const item = items[closest];
            onSelectOrder(item.kind === "stop" ? item.stop.order : undefined);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
                >
                    <div className="w-[11%] shrink-0" aria-hidden />
                    {items.map((item, i) => (
                        <CourseCard
                            key={item.kind === "stop" ? item.stop.id : item.role}
                            item={item}
                            active={i === activeIndex}
                            onSelect={() => selectIndex(i, true)}
                            onDetail={
                                item.kind === "stop"
                                    ? () => onDetail(item.stop.place.id)
                                    : undefined
                            }
                            cardRef={(el) => {
                                cardRefs.current[i] = el;
                            }}
                        />
                    ))}
                    <div className="w-[11%] shrink-0" aria-hidden />
                </div>

                {activeIndex > 0 && (
                    <button
                        type="button"
                        aria-label="이전 방문지"
                        onClick={() => selectIndex(activeIndex - 1, true)}
                        className="absolute top-1/2 left-1 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-zinc-600 shadow-md backdrop-blur hover:bg-white"
                    >
                        <ChevronLeft size={16} aria-hidden />
                    </button>
                )}

                {activeIndex < items.length - 1 && (
                    <button
                        type="button"
                        aria-label="다음 방문지"
                        onClick={() => selectIndex(activeIndex + 1, true)}
                        className="absolute top-1/2 right-1 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-zinc-600 shadow-md backdrop-blur hover:bg-white"
                    >
                        <ChevronRight size={16} aria-hidden />
                    </button>
                )}
            </div>

            <div className="px-1 pt-1">
                <div className="relative h-1 rounded-full bg-zinc-100">
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-[#2E7DF2] to-[#17B89B] transition-all"
                        style={{
                            width: `${(activeIndex / Math.max(items.length - 1, 1)) * 100}%`,
                        }}
                    />
                    {items.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`${i + 1}번째로 이동`}
                            onClick={() => selectIndex(i, true)}
                            className="absolute top-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                            style={{ left: `${(i / Math.max(items.length - 1, 1)) * 100}%` }}
                        >
                            <span
                                className={`size-2.5 rounded-full border-2 border-white shadow transition-colors ${
                                    i <= activeIndex ? "bg-[#2E7DF2]" : "bg-zinc-300"
                                }`}
                            />
                        </button>
                    ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-zinc-400">
                    {items.map((item, i) => (
                        <span
                            key={i}
                            className={i === activeIndex ? "font-bold text-[#2E7DF2]" : ""}
                        >
                            {hhmm(item.kind === "stop" ? item.stop.arriveAt : item.time)}
                        </span>
                    ))}
                </div>
            </div>

            <TransitPanel transit={activeTransit} />
        </div>
    );
}
