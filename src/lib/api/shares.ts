import type { ShareLink, SharedScheduleResponse } from "@/types/api/shared-schedule";
import type { ScheduleMapResponse } from "@/types/api/schedule-map";
import apiClient from "./axios";

export async function createShareLink(scheduleId: string, expiresInDays = 7) {
  const { data } = await apiClient.post<ShareLink>(`/schedules/${scheduleId}/shares`, {
    expiresInDays,
  });
  return data;
}

export async function revokeShareLink(scheduleId: string, shareId: string) {
  await apiClient.delete(`/schedules/${scheduleId}/shares/${shareId}`);
}

export async function getSharedSchedule(token: string) {
  const { data } = await apiClient.get<SharedScheduleResponse>(`/shared-schedules/${token}`);
  return data;
}

export async function getSharedScheduleMap(token: string, dayNo?: number) {
  const { data } = await apiClient.get<ScheduleMapResponse>(`/shared-schedules/${token}/map`, {
    params: dayNo ? { dayNo } : {},
  });
  return data;
}
