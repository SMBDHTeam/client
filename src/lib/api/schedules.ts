import type { PlaceSearchItem } from "@/types/api/place";
import type { SchedulePreview } from "@/types/api/schedule-preview";
import type { ScheduleResponse } from "@/types/api/schedule";
import type { ScheduleMapResponse } from "@/types/api/schedule-map";
import { requestJson } from "./client";
import { assertScheduleV2Available, scheduleV2Mode } from "./config";
import { mockCreateSchedule, mockGetSchedule, mockGetScheduleMap } from "./mock-schedule-v2";

export function createSchedule(
  preview: SchedulePreview,
  idempotencyKey: string,
  selectedPlaces: PlaceSearchItem[] = [],
) {
  assertScheduleV2Available();
  if (scheduleV2Mode === "mock") return mockCreateSchedule(preview, selectedPlaces);
  return requestJson<ScheduleResponse>("/schedules", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ previewId: preview.previewId }),
  });
}

export function getSchedule(scheduleId: string) {
  assertScheduleV2Available();
  if (scheduleV2Mode === "mock") return mockGetSchedule(scheduleId);
  return requestJson<ScheduleResponse>(`/schedules/${scheduleId}`);
}

export function getScheduleMap(scheduleId: string, dayNo?: number) {
  assertScheduleV2Available();
  if (scheduleV2Mode === "mock") return mockGetScheduleMap(scheduleId, dayNo);
  const query = dayNo ? `?dayNo=${dayNo}` : "";
  return requestJson<ScheduleMapResponse>(`/schedules/${scheduleId}/map${query}`);
}
