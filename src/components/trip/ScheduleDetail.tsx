"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import ScheduleCourseView, {
  type ScheduleCourseMarker,
  type ScheduleCoursePlace,
} from "@/components/trip/ScheduleCourseView";
import PlaceDetailSheet from "@/components/sheet/PlaceDetailSheet";
import { getSchedule, getScheduleMap } from "@/lib/api/schedules";
import { formatCourseTime, formatKoreanReturnTime } from "@/lib/schedule-course";
import { placeCategoryLabel } from "@/utils/place-category";
import type { ScheduleResponse } from "@/types/api/schedule";
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

export default function ScheduleDetail({ scheduleId }: { scheduleId: string }) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [mapResult, setMapResult] = useState<{
    dayNo: number;
    data: ScheduleMapResponse;
  } | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [detailPlaceId, setDetailPlaceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSchedule(scheduleId)
      .then((scheduleResponse) => {
        if (!cancelled) setSchedule(scheduleResponse);
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
        if (!cancelled) setMapResult({ dayNo: day.dayNo, data: response });
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

  const mapData =
    mapResult && mapResult.dayNo === day?.dayNo ? mapResult.data : null;

  const places = useMemo<ScheduleCoursePlace[]>(
    () =>
      day?.stops.map((stop) => {
        const marker = mapData?.markers.find(
          (item) =>
            item.dayNo === day.dayNo &&
            (item.placeId === stop.place.id || item.order === stop.order),
        );
        return {
          id: stop.id,
          placeId: stop.place.id,
          order: stop.order,
          latitude:
            finiteCoordinate(marker?.latitude) ?? finiteCoordinate(stop.place.latitude),
          longitude:
            finiteCoordinate(marker?.longitude) ?? finiteCoordinate(stop.place.longitude),
          imageUrl: stop.place.primaryImageUrl ?? null,
          arrivalTime: formatCourseTime(stop.arriveAtDateTime ?? stop.arriveAt),
          title: stop.place.name,
          categoryLabel:
            stop.place.categoryLabel || placeCategoryLabel(stop.place.category),
          stayMinutes: stop.stayMinutes,
          inboundTransit: stop.inboundTransit,
          mealLabel:
            stop.mealTimeSlot === "LUNCH"
              ? "점심 추천"
              : stop.mealTimeSlot === "DINNER"
                ? "저녁 추천"
                : null,
          waitingMinutesBefore: stop.waitingMinutesBefore,
          warnings: stop.warnings ?? [],
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
  const endMarker =
    courseMarker(mapData?.endMarker) ?? courseMarker(day?.endLocation ?? null);
  const isSpontaneous = schedule?.scheduleType === "SPONTANEOUS";
  const returnArrivalLabel = isSpontaneous
    ? formatKoreanReturnTime(schedule?.estimatedReturnAt, schedule?.startAt)
    : null;
  const returnSummary =
    isSpontaneous && day?.finalTransit
      ? "마지막 장소에서 " + day.finalTransit.totalMinutes + "분 이동"
      : null;

  function selectDay(index: number) {
    setDayIndex(index);
    setDetailPlaceId(null);
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
          onClick={() => router.push("/trips/" + scheduleId + "/edit")}
          aria-label="일정 수정"
          className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          aria-label="공유"
          onClick={() =>
            navigator.share?.({ title: "Day " + day.dayNo + " 일정", url: location.href }).catch(() => {})
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
          finalTransitTitle={isSpontaneous ? "출발지로 복귀" : "마지막 도착지로 이동"}
          returnSummary={returnSummary}
          returnArrivalLabel={returnArrivalLabel}
          publicTransitOnly={isSpontaneous}
          onPlaceDetail={setDetailPlaceId}
        />
      </div>

      {detailPlaceId != null && (
        <PlaceDetailSheet
          placeId={detailPlaceId}
          onClose={() => setDetailPlaceId(null)}
        />
      )}
    </div>
  );
}
