import type { PlaceSearchItem } from "@/types/api/place";
import type { SchedulePreview } from "@/types/api/schedule-preview";
import type { ScheduleResponse } from "@/types/api/schedule";
import type { ScheduleMapResponse } from "@/types/api/schedule-map";
import apiClient from "./axios";

export async function createSchedule(
  preview: SchedulePreview,
  idempotencyKey: string,
  _selectedPlaces: PlaceSearchItem[] = [],
) {
  const { data } = await apiClient.post<ScheduleResponse>("/schedules", { previewId: preview.previewId }, {
    headers: { "Idempotency-Key": idempotencyKey },
  });
  return data;
}

export async function getSchedule(scheduleId: string) {
  const { data } = await apiClient.get<ScheduleResponse>(`/schedules/${scheduleId}`);
  return data;
}

export async function getScheduleMap(scheduleId: string, dayNo?: number) {
  const { data } = await apiClient.get<ScheduleMapResponse>(`/schedules/${scheduleId}/map`, {
    params: dayNo ? { dayNo } : {},
  });
  return data;
}
