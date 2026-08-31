import type { CreateSchedulePreviewRequest, SchedulePreview } from "@/types/api/schedule-preview";
import apiClient from "./axios";

export async function createSchedulePreview(request: CreateSchedulePreviewRequest) {
  const { data } = await apiClient.post<SchedulePreview>("/schedule-previews", request);
  return data;
}

export async function getSchedulePreview(previewId: string) {
  const { data } = await apiClient.get<SchedulePreview>(`/schedule-previews/${previewId}`);
  return data;
}
