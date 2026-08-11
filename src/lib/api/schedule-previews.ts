import type { CreateSchedulePreviewRequest, SchedulePreview } from "@/types/api/schedule-preview";
import { requestJson } from "./client";

export function createSchedulePreview(request: CreateSchedulePreviewRequest) {
  return requestJson<SchedulePreview>("/schedule-previews", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function getSchedulePreview(previewId: string) {
  return requestJson<SchedulePreview>(`/schedule-previews/${previewId}`);
}
