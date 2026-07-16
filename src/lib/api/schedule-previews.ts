import type { CreateSchedulePreviewRequest, SchedulePreview } from "@/types/api/schedule-preview";
import { requestJson } from "./client";
import { assertScheduleV2Available, scheduleV2Mode } from "./config";
import { mockCreateSchedulePreview, mockGetSchedulePreview } from "./mock-schedule-v2";

export function createSchedulePreview(request: CreateSchedulePreviewRequest) {
  assertScheduleV2Available();
  if (scheduleV2Mode === "mock") return mockCreateSchedulePreview(request);
  return requestJson<SchedulePreview>("/schedule-previews", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function getSchedulePreview(previewId: string) {
  assertScheduleV2Available();
  if (scheduleV2Mode === "mock") return mockGetSchedulePreview(previewId);
  return requestJson<SchedulePreview>(`/schedule-previews/${previewId}`);
}
