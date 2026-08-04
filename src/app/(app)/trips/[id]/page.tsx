"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CourseCarousel from "@/components/trip/CourseCarousel";
import MapTiler3D from "@/components/map/MapTiler3D";
import MapViewToggle, { type MapView } from "@/components/map/MapViewToggle";
import NaverMap from "@/components/map/NaverMap";
import PageFade from "@/components/ui/PageFade";
import PlaceDetailSheet from "@/components/sheet/PlaceDetailSheet";
import { ChevronDown, Pencil, Share2 } from "lucide-react";
import { getScheduleMap, getSchedules, createShare, ApiError } from "@/services";
import type { Schedule, ScheduleListItem, ScheduleMap, Transit } from "@/types/api";
import { dateRange, stopColor } from "@/utils/scheduleFormat";

type Schedulish = Schedule | ScheduleListItem;


export default function TripDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [schedule, setSchedule] = useState<Schedulish | null>(null);
    const [map, setMap] = useState<ScheduleMap | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [shareMsg, setShareMsg] = useState<string | null>(null);

    const [dayIndex, setDayIndex] = useState(0);
    const [activeOrder, setActiveOrder] = useState<number | undefined>();
    const [detailPlaceId, setDetailPlaceId] = useState<number | null>(null);
    const [mapView, setMapView] = useState<MapView>("2d");
    const [summaryOpen, setSummaryOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getSchedules()
            .then((data) => {
                if (cancelled) return;
                const found = data.items.find((s) => s.id === id);
                if (found) setSchedule(found);
                else setNotFound(true);
            })
            .catch(() => !cancelled && setNotFound(true));
        getScheduleMap(id)
            .then((m) => !cancelled && setMap(m))
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [id]);

    const days = schedule?.days ?? [];
    const day = days[dayIndex];
    const dayNo = day?.dayNo;
    const stops = useMemo(() => day?.stops ?? [], [day]);

    const route = useMemo(() => {
        const markers = (map?.markers ?? [])
            .filter((m) => m.dayNo === dayNo)
            .sort((a, b) => a.order - b.order);
        if (markers.length > 0) {
            return markers.map((m, i) => ({
                lat: m.latitude,
                lng: m.longitude,
                order: m.order,
                color: stopColor(i),
            }));
        }
        return stops.map((s, i) => ({
            lat: s.place.latitude,
            lng: s.place.longitude,
            order: s.order,
            color: stopColor(i),
        }));
    }, [map, dayNo, stops]);

    const paths = useMemo(
        () =>
            (map?.routeLines ?? [])
                .filter((l) => l.dayNo === dayNo)
                .sort(
                    (a, b) =>
                        a.routeOrder - b.routeOrder || a.lineOrder - b.lineOrder,
                )
                .map((l) => ({ mode: l.mode, coordinates: l.coordinates })),
        [map, dayNo],
    );

    const markers3d = useMemo(
        () =>
            route.map((p) => ({
                lat: p.lat,
                lng: p.lng,
                order: p.order,
                color: p.color,
                label: stops.find((s) => s.order === p.order)?.place.name ?? `${p.order}번째`,
            })),
        [route, stops],
    );

    const stats = useMemo(() => {
        const transits: (Transit | null)[] = [
            ...stops.map((s) => s.inboundTransit),
            day?.finalTransit ?? null,
        ];
        let move = 0;
        let walk = 0;
        let fare = 0;
        for (const t of transits) {
            if (!t) continue;
            move += t.totalMinutes;
            walk += t.walkMinutes;
            fare += t.fareAmount ?? 0;
        }
        const stay = stops.reduce((sum, s) => sum + s.stayMinutes, 0);
        return { move, walk, fare, stay };
    }, [stops, day]);

    async function handleShare() {
        setShareMsg(null);
        try {
            const share = await createShare(id);
            const url =
                typeof window !== "undefined"
                    ? new URL(share.url, window.location.origin).toString()
                    : share.url;
            if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({ title: "여행 일정", url }).catch(() => {});
                return;
            }
            if (typeof navigator !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                setShareMsg("공유 링크를 복사했어요");
            } else {
                setShareMsg(url);
            }
        } catch (e) {
            setShareMsg(
                e instanceof ApiError
                    ? "공유 링크 생성에 실패했어요"
                    : "공유 링크 생성에 실패했어요",
            );
        }
    }

    function selectDay(index: number) {
        setDayIndex(index);
        setActiveOrder(undefined);
    }


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

    if (!schedule || !day) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-zinc-400">불러오는 중...</p>
            </div>
        );
    }

    const mapCenter =
        stops.length > 0
            ? { lat: stops[0].place.latitude, lng: stops[0].place.longitude }
            : undefined;

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
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-bold">Day {day.dayNo}</h1>
                    <p className="text-xs text-zinc-400">{dateRange(schedule)}</p>
                </div>
                <button
                    type="button"
                    aria-label="일정 수정"
                    onClick={() => router.push(`/trips/${id}/edit`)}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
                >
                    <Pencil size={19} aria-hidden />
                </button>
                <button
                    type="button"
                    aria-label="공유"
                    onClick={handleShare}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
                >
                    <Share2 size={20} aria-hidden />
                </button>
            </header>

            {shareMsg && (
                <p className="px-5 pb-1 text-center text-xs font-medium text-[#2E7DF2]">
                    {shareMsg}
                </p>
            )}

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-8">
                {days.length > 1 && (
                    <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
                        {days.map((d, i) => (
                            <button
                                key={d.dayNo}
                                type="button"
                                onClick={() => selectDay(i)}
                                className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                                    i === dayIndex
                                        ? "bg-linear-to-br from-[#2E7DF2] to-[#17B89B] font-bold text-white shadow-sm"
                                        : "text-zinc-400"
                                }`}
                            >
                                Day {d.dayNo}
                            </button>
                        ))}
                    </div>
                )}

                <div className="relative h-72 w-full shrink-0">
                    {mapView === "2d" ? (
                        <NaverMap
                            center={mapCenter}
                            route={route}
                            paths={paths}
                            activeOrder={activeOrder}
                            className="h-full w-full overflow-hidden rounded-3xl"
                        />
                    ) : (
                        <MapTiler3D
                            center={mapCenter}
                            markers={markers3d}
                            className="h-full w-full overflow-hidden rounded-3xl"
                        />
                    )}
                    <MapViewToggle view={mapView} onChange={setMapView} />
                </div>

                <div className="flex flex-wrap gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                        <span className="h-0.5 w-4 rounded bg-[#2E7DF2]" /> 버스
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-0.5 w-4 rounded bg-[#F59E0B]" /> 지하철
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="h-0.5 w-4 rounded bg-zinc-400" /> 도보
                    </span>
                </div>

                <div className="rounded-2xl bg-[#F5F8FF] ring-1 ring-black/5">
                    <button
                        type="button"
                        onClick={() => setSummaryOpen((v) => !v)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto text-xs font-medium text-zinc-500">
                            <span className="shrink-0 rounded-full bg-white px-2 py-1 font-bold text-[#2E7DF2] ring-1 ring-black/5">
                                {stops.length}곳
                            </span>
                            <span className="shrink-0">체류 {stats.stay}분</span>
                            <span className="shrink-0">이동 {stats.move}분</span>
                            <span className="shrink-0">
                                {stats.fare > 0
                                    ? `${stats.fare.toLocaleString("ko-KR")}원`
                                    : "요금 -"}
                            </span>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#2E7DF2]">
                            {summaryOpen ? "접기" : "자세히"}
                            <ChevronDown
                                size={18}
                                aria-hidden
                                className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`}
                            />
                        </span>
                    </button>

                    {summaryOpen && (
                        <div className="flex flex-col gap-3 border-t border-black/5 px-4 pt-3 pb-4">
                            {day.summary && (
                                <p className="text-sm leading-relaxed text-zinc-600">
                                    {day.summary}
                                </p>
                            )}
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: "방문", value: `${stops.length}곳` },
                                    { label: "체류", value: `${stats.stay}분` },
                                    { label: "이동", value: `${stats.move}분` },
                                    {
                                        label: "요금",
                                        value:
                                            stats.fare > 0
                                                ? `${stats.fare.toLocaleString("ko-KR")}원`
                                                : "-",
                                    },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5"
                                    >
                                        <p className="text-[11px] text-zinc-400">{s.label}</p>
                                        <p className="mt-0.5 text-sm font-bold">{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <h2 className="text-lg font-bold">오늘의 코스</h2>

                {stops.length === 0 ? (
                    <p className="text-sm text-zinc-400">이 날의 방문지가 없어요.</p>
                ) : (
                    <CourseCarousel
                        key={day.dayNo}
                        day={day}
                        stops={stops}
                        onSelectOrder={setActiveOrder}
                        onDetail={(placeId) => setDetailPlaceId(placeId)}
                    />
                )}
            </div>

            {detailPlaceId != null && (
                <PlaceDetailSheet
                    placeId={detailPlaceId}
                    onClose={() => setDetailPlaceId(null)}
                />
            )}
        </PageFade>
    );
}
