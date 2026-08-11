import type { PlaceSearchItem } from "@/types/api/place";
import type { SchedulePreview } from "@/types/api/schedule-preview";
import type { ScheduleResponse } from "@/types/api/schedule";
import type { ScheduleMapResponse } from "@/types/api/schedule-map";
import { requestJson } from "./client";

export function createSchedule(
  preview: SchedulePreview,
  idempotencyKey: string,
  _selectedPlaces: PlaceSearchItem[] = [],
) {
  return requestJson<ScheduleResponse>("/schedules", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ previewId: preview.previewId }),
  });
}

export function getSchedule(scheduleId: string) {
  return requestJson<ScheduleResponse>(`/schedules/${scheduleId}`);
}

export function getScheduleMap(scheduleId: string, dayNo?: number) {
  const query = dayNo ? `?dayNo=${dayNo}` : "";
  return requestJson<ScheduleMapResponse>(`/schedules/${scheduleId}/map${query}`);
}
