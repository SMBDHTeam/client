"use client";

import { use, useEffect, useMemo, useState } from "react";
import ScheduleCourseView, {
  type ScheduleCourseMarker,
  type ScheduleCoursePlace,
} from "@/components/trip/ScheduleCourseView";
import { getSharedSchedule, getSharedScheduleMap } from "@/lib/api/shares";
import { formatCourseTime } from "@/lib/schedule-course";
import { ApiError } from "@/lib/api/axios";
import type { SharedScheduleResponse } from "@/types/api/shared-schedule";
import type { ScheduleMapResponse } from "@/types/api/schedule-map";

function finiteCoordinate(value: number | null | undefined) {
  return value != null && Number.isFinite(value) ? value : null;
}

function courseMarker(
  marker:
    | { name: string; latitude: number | null; longitude: number | null }
    | null
    | undefined,
): ScheduleCourseMarker | null {
  const latitude = finiteCoordinate(marker?.latitude);
  const longitude = finiteCoordinate(marker?.longitude);
  if (!marker || latitude == null || longitude == null) return null;
  return { name: marker.name, latitude, longitude };
}

export default function SharedSchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [schedule, setSchedule] = useState<SharedScheduleResponse | null>(null);
  const [mapResult, setMapResult] = useState<{
    dayNo: number;
    data: ScheduleMapResponse;
  } | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSharedSchedule(token)
      .then((res) => {
        if (!cancelled) setSchedule(res);
      })
      .catch((cause) => {
        if (cancelled) return;
        setError(
          cause instanceof ApiError && cause.status === 404
            ? "만료되었거나 존재하지 않는 공유 링크예요."
            : "일정을 불러오지 못했어요.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const day = schedule?.days[dayIndex];

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    getSharedScheduleMap(token, day.dayNo)
      .then((response) => {
        if (!cancelled) setMapResult({ dayNo: day.dayNo, data: response });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [day, token]);

  const mapData = mapResult && mapResult.dayNo === day?.dayNo ? mapResult.data : null;

  const places = useMemo<ScheduleCoursePlace[]>(
    () =>
      day?.stops.map((stop) => {
        const marker = mapData?.markers.find(
          (item) => item.dayNo === day.dayNo && (item.placeId === stop.placeId || item.order === stop.order),
        );
        return {
          id: stop.stopId,
          placeId: stop.placeId,
          order: stop.order,
          latitude: finiteCoordinate(marker?.latitude),
          longitude: finiteCoordinate(marker?.longitude),
          imageUrl: null,
          arrivalTime: formatCourseTime(marker?.arriveAtDateTime ?? marker?.arriveAt),
          title: marker?.name ?? `장소 #${stop.placeId}`,
          categoryLabel: marker?.subtitle ?? null,
          stayMinutes: stop.stayMinutes,
          inboundTransit: null,
          waitingMinutesBefore: 0,
          warnings: [],
        };
      }) ?? [],
    [day, mapData?.markers],
  );

  const dayRouteLines = useMemo(
    () => mapData?.routeLines.filter((line) => line.dayNo === day?.dayNo) ?? [],
    [day?.dayNo, mapData?.routeLines],
  );
  const startMarker =
    courseMarker(mapData?.startMarker) ?? courseMarker(day?.startLocation ?? null);
  const endMarker = courseMarker(mapData?.endMarker) ?? courseMarker(day?.endLocation ?? null);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
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
        <h1 className="flex-1 text-center text-lg font-bold">
          {schedule.styleSummary || "공유된 일정"} · Day {day.dayNo}
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-6">
        <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
          {schedule.days.map((item, index) => (
            <button
              key={item.dayNo}
              type="button"
              onClick={() => setDayIndex(index)}
              className={
                "flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors " +
                (index === dayIndex
                  ? "bg-linear-to-br from-[#2E7DF2] to-[#17B89B] font-bold text-white shadow-sm"
                  : "text-zinc-400")
              }
            >
              Day {item.dayNo}
            </button>
          ))}
        </div>

        <ScheduleCourseView
          key={day.dayNo}
          places={places}
          routeLines={dayRouteLines}
          startMarker={startMarker}
          endMarker={endMarker}
          finalTransit={day.finalTransit}
          finalTransitTitle="마지막 도착지로 이동"
        />
      </div>
    </div>
  );
}
