"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import NaverMap from "@/components/map/NaverMap";
import { getSchedule, getScheduleMap } from "@/lib/api/schedules";
import { placeCategoryLabel } from "@/utils/place-category";
import type { ScheduleResponse, ScheduleTransit } from "@/types/api/schedule";
import type { ScheduleMapResponse } from "@/types/api/schedule-map";

const MARKER_COLORS = ["#2E7DF2", "#17B89B", "#F59E0B", "#E85D75"];
const CARD_GRADIENTS = [
  "from-[#2E7DF2] to-[#17B89B]",
  "from-[#F7A18E] to-[#F16E5E]",
  "from-[#8B7DF2] to-[#5B5EE8]",
  "from-[#17B89B] to-[#2E9A6D]",
];

const TRANSIT_MODE = {
  WALK: { label: "도보", className: "bg-zinc-100 text-zinc-600" },
  BUS: { label: "버스", className: "bg-blue-100 text-blue-700" },
  SUBWAY: { label: "지하철", className: "bg-emerald-100 text-emerald-700" },
  TRAIN: { label: "열차", className: "bg-violet-100 text-violet-700" },
} as const;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function routeDistanceKm(points: Array<{ lat: number; lng: number }>) {
  let distance = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const latitudeDelta = toRadians(current.lat - previous.lat);
    const longitudeDelta = toRadians(current.lng - previous.lng);
    const previousLatitude = toRadians(previous.lat);
    const currentLatitude = toRadians(current.lat);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(previousLatitude) *
        Math.cos(currentLatitude) *
        Math.sin(longitudeDelta / 2) ** 2;
    distance += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return distance;
}

function transitLabel(transit: ScheduleTransit) {
  const rides = transit.segments
    .filter((segment) => segment.mode !== "WALK")
    .map((segment) => {
      const line = segment.lineName ? ` ${segment.lineName}` : "";
      return `${TRANSIT_MODE[segment.mode].label}${line}`;
    });
  const summary = rides.length > 0 ? rides.join(" → ") : "도보";
  return `${summary} · ${transit.totalMinutes}분`;
}

function TransitPanel({ transit }: { transit: ScheduleTransit }) {
  const estimated =
    transit.provider === "FAKE" ||
    transit.provider === "UNKNOWN" ||
    transit.fallbackUsed ||
    transit.realtimeStatus === "UNAVAILABLE";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm leading-snug font-semibold text-zinc-800">{transitLabel(transit)}</p>
          <p className="mt-1 truncate text-xs text-zinc-500">
            {transit.originName} → {transit.destinationName}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
            estimated ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {estimated ? "예상 이동시간" : "경로 확인"}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span>도보 {transit.walkMinutes}분</span>
        <span>환승 {transit.transferCount}회</span>
        {transit.fareAmount != null && <span>약 {transit.fareAmount.toLocaleString()}원</span>}
        <span>{transit.provider}</span>
      </div>
      {transit.segments.length > 0 && (
        <ol className="mt-3 flex flex-wrap items-center gap-1.5">
          {transit.segments.map((segment, index) => {
            const mode = TRANSIT_MODE[segment.mode];
            return (
              <li key={`${segment.order}-${segment.mode}`} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-xs text-zinc-300">→</span>}
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${mode.className}`}>
                  {mode.label}{segment.lineName ? ` ${segment.lineName}` : ""} · {segment.durationMinutes}분
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {transit.segments.length > 0 && (
        <details className="mt-3 border-t border-zinc-100 pt-2 text-xs text-zinc-600">
          <summary className="cursor-pointer font-semibold text-zinc-700">구간 자세히</summary>
          <ol className="mt-2 space-y-2">
            {transit.segments.map((segment) => (
              <li key={`${segment.order}-${segment.mode}`} className="flex items-start gap-2 leading-relaxed">
                <span className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${TRANSIT_MODE[segment.mode].className}`}>
                  {TRANSIT_MODE[segment.mode].label}
                </span>
                <span>
                  {segment.lineName ? `${segment.lineName} · ` : ""}{segment.durationMinutes}분
                  <br />
                  <span className="text-zinc-400">{segment.instruction}</span>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
      {transit.warnings.map((warning) => (
        <p key={warning} className="mt-2 text-xs text-amber-700">{warning}</p>
      ))}
    </div>
  );
}

export default function ScheduleDetail({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [mapData, setMapData] = useState<ScheduleMapResponse | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSchedule(scheduleId)
      .then((scheduleResponse) => {
        if (cancelled) return;
        setSchedule(scheduleResponse);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "일정을 불러오지 못했습니다.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [scheduleId]);

  const day = schedule?.days[dayIndex];
  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    getScheduleMap(scheduleId, day.dayNo)
      .then((response) => {
        if (!cancelled) setMapData(response);
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "지도를 불러오지 못했습니다.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [day, scheduleId]);
  const activeMapData = mapData?.markers.some((marker) => marker.dayNo === day?.dayNo)
    ? mapData
    : null;
  const dayMarkers = useMemo(
    () => activeMapData?.markers ?? [],
    [activeMapData?.markers],
  );
  const places = useMemo(
    () =>
      day?.stops.map((stop, index) => {
        const marker = dayMarkers.find(
          (item) => item.placeId === stop.place.id || item.order === stop.order,
        );
        return {
          id: stop.id,
          order: stop.order,
          lat: marker?.latitude ?? stop.place.latitude,
          lng: marker?.longitude ?? stop.place.longitude,
          color: MARKER_COLORS[index % MARKER_COLORS.length],
          gradient: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
          time: stop.arriveAt,
          title: stop.place.name,
          subtitle: `${stop.place.categoryLabel ?? placeCategoryLabel(stop.place.category)} · 체류 ${stop.stayMinutes}분`,
          inboundTransit: stop.inboundTransit,
          mealLabel: stop.mealTimeSlot === "LUNCH"
            ? "점심 추천"
            : stop.mealTimeSlot === "DINNER"
              ? "저녁 추천"
              : null,
          waitingMinutesBefore: stop.waitingMinutesBefore,
          warnings: stop.warnings ?? [],
        };
      }) ?? [],
    [day?.stops, dayMarkers],
  );
  const route = useMemo(
    () =>
      places.map((place) => ({
        lat: place.lat,
        lng: place.lng,
        order: place.order,
        color: place.color,
      })),
    [places],
  );
  const dayRouteLines = useMemo(
    () => activeMapData?.routeLines ?? [],
    [activeMapData?.routeLines],
  );
  const activeRoute = (() => {
    const destination = route[activeIndex];
    if (!destination) return [];

    if (activeIndex > 0) return [route[activeIndex - 1], destination];
    if (!activeMapData?.startMarker) return [destination];

    return [
      {
        lat: activeMapData.startMarker.latitude,
        lng: activeMapData.startMarker.longitude,
        order: 0,
        color: "#18181B",
      },
      destination,
    ];
  })();
  const activeRouteLines = useMemo(() => {
    const activeOrder = places[activeIndex]?.order;
    if (activeOrder == null) return [];
    return dayRouteLines
      .filter((line) => line.routeOrder === activeOrder)
      .toSorted((left, right) => left.lineOrder - right.lineOrder);
  }, [activeIndex, dayRouteLines, places]);
  const transferPoints = useMemo(
    () =>
      activeRouteLines
        .filter((line) => line.mode !== "WALK" && line.coordinates.length > 0)
        .slice(1)
        .map((line, index) => ({
          name: `환승 ${index + 1}`,
          lat: line.coordinates[0][1],
          lng: line.coordinates[0][0],
          mode: line.mode,
          lineName: line.lineName,
        })),
    [activeRouteLines],
  );
  const activeStartMarker = activeIndex === 0 ? activeMapData?.startMarker : null;
  const activeDestination = places[activeIndex];
  const activeEndMarker =
    activeDestination &&
    activeMapData?.endMarker &&
    Math.abs(activeMapData.endMarker.latitude - activeDestination.lat) < 0.0000001 &&
    Math.abs(activeMapData.endMarker.longitude - activeDestination.lng) < 0.0000001
      ? activeMapData.endMarker
      : null;
  const distanceKm = useMemo(() => {
    if (dayRouteLines.length === 0) return routeDistanceKm(route);
    const measuredMeters = dayRouteLines.reduce(
      (total, line) => total + (line.distanceMeters ?? 0),
      0,
    );
    if (measuredMeters > 0) return measuredMeters / 1000;

    return dayRouteLines.reduce(
      (total, line) =>
        total +
        routeDistanceKm(
          line.coordinates.map(([lng, lat]) => ({ lat, lng })),
        ),
      0,
    );
  }, [dayRouteLines, route]);
  const progress = places.length > 1 ? (activeIndex / (places.length - 1)) * 100 : 0;
  const activeTransit = places[activeIndex]?.inboundTransit;
  const activePlace = places[activeIndex];

  useEffect(() => {
    function recalculateOffset() {
      const viewport = viewportRef.current;
      const track = viewport?.firstElementChild as HTMLElement | null;
      const card = track?.firstElementChild as HTMLElement | null;
      if (!viewport || !card) return;
      const step = card.offsetWidth + 12;
      setOffset(viewport.offsetWidth / 2 - activeIndex * step - card.offsetWidth / 2);
    }

    recalculateOffset();
    const frame = requestAnimationFrame(() => setAnimate(true));
    window.addEventListener("resize", recalculateOffset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", recalculateOffset);
    };
  }, [activeIndex, places]);

  function selectDay(index: number) {
    setDayIndex(index);
    setActiveIndex(0);
  }

  function goTo(index: number) {
    setActiveIndex(Math.min(places.length - 1, Math.max(0, index)));
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => router.replace("/trips")}
          className="mt-4 text-sm font-bold text-[#2E7DF2]"
        >
          일정 목록으로
        </button>
      </div>
    );
  }

  if (!schedule || !day) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.push("/trips")}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        <h1 className="flex-1 text-center text-lg font-bold">Day {day.dayNo}</h1>
        <button
          type="button"
          onClick={() => router.push(`/trips/${scheduleId}/edit`)}
          aria-label="일정 수정"
          className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          aria-label="공유"
          onClick={() =>
            navigator.share?.({ title: `Day ${day.dayNo} 일정`, url: location.href }).catch(() => {})
          }
          className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
          {schedule.days.map((item, index) => (
            <button
              key={item.dayNo}
              type="button"
              onClick={() => selectDay(index)}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                index === dayIndex
                  ? "bg-linear-to-br from-[#2E7DF2] to-[#17B89B] font-bold text-white shadow-sm"
                  : "text-zinc-400"
              }`}
            >
              Day {item.dayNo}
            </button>
          ))}
        </div>

        {route.length > 0 && (
          <div className="relative shrink-0">
            <NaverMap
              center={{ lat: activeRoute[0]?.lat ?? route[0].lat, lng: activeRoute[0]?.lng ?? route[0].lng }}
              route={activeRoute}
              routeLines={activeRouteLines}
              transferPoints={transferPoints}
              startMarker={activeStartMarker ? {
                name: activeStartMarker.name,
                lat: activeStartMarker.latitude,
                lng: activeStartMarker.longitude,
              } : null}
              endMarker={activeEndMarker ? {
                name: activeEndMarker.name,
                lat: activeEndMarker.latitude,
                lng: activeEndMarker.longitude,
              } : null}
              activeOrder={places[activeIndex]?.order}
              className="h-72 w-full overflow-hidden rounded-3xl"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">오늘의 코스</h2>
          <p className="text-sm text-zinc-400">
            {places.length}곳 · 약 {distanceKm.toFixed(1)}km
          </p>
        </div>

        {places.length > 0 ? (
          <>
            {activeTransit && <TransitPanel transit={activeTransit} />}
            <div className="relative">
              <div ref={viewportRef} className="-mx-5 overflow-hidden py-1">
                <div
                  className={`flex gap-3 ${animate ? "transition-transform duration-300 ease-out" : ""}`}
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  {places.map((place, index) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => goTo(index)}
                      className={`relative flex h-48 w-[80%] shrink-0 flex-col justify-end overflow-hidden rounded-3xl bg-linear-to-br p-5 text-left text-white transition-opacity duration-300 ${place.gradient} ${
                        index === activeIndex ? "" : "opacity-60"
                      }`}
                    >
                      <span className="absolute top-4 left-4 grid size-7 place-items-center rounded-full bg-white text-sm font-bold text-zinc-900">
                        {place.order}
                      </span>
                      <span className="absolute top-4 right-4 flex items-center gap-1.5">
                        {place.mealLabel && (
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-zinc-900">
                            {place.mealLabel}
                          </span>
                        )}
                        <span className="rounded-full bg-black/30 px-2.5 py-1 text-sm font-semibold">
                          {place.time}
                        </span>
                      </span>
                      <span className="text-lg font-bold">{place.title}</span>
                      <span className="mt-1 text-sm text-white/90">{place.subtitle}</span>
                      {place.waitingMinutesBefore > 0 && (
                        <span className="mt-1 text-xs text-white/80">
                          식사 시간까지 {place.waitingMinutesBefore}분 여유
                        </span>
                      )}
                    </button>
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
              {places.map((place, index) => (
                <span
                  key={place.id}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-5 bg-[#2E7DF2]" : "w-1.5 bg-zinc-200"
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
                {places.map((place, index) => (
                  <span
                    key={place.id}
                    className={index === activeIndex ? "font-bold text-[#2E7DF2]" : ""}
                  >
                    {place.time}
                  </span>
                ))}
              </div>
            </div>

            {activePlace && activePlace.warnings.length > 0 && (
              <section className="mt-2 rounded-2xl bg-amber-50 px-4 py-3">
                <h3 className="text-sm font-bold text-amber-900">
                  {activePlace.title} 확인 사항
                </h3>
                <ul className="mt-1.5 space-y-1">
                  {activePlace.warnings.map((warning) => (
                    <li key={warning} className="text-xs leading-relaxed text-amber-800">
                      {warning}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {day.finalTransit && (
              <section className="mt-2">
                <h3 className="mb-2 text-sm font-bold text-zinc-800">마지막 도착지로 이동</h3>
                <TransitPanel transit={day.finalTransit} />
              </section>
            )}
          </>
        ) : (
          <p className="rounded-2xl bg-zinc-50 py-12 text-center text-sm text-zinc-400">
            이 날짜에 배정된 장소가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
