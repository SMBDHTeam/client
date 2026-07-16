export type ScheduleV2Mode = "disabled" | "mock" | "live";

const configuredMode = process.env.NEXT_PUBLIC_SCHEDULE_V2_MODE;
const fallbackMode = process.env.NODE_ENV === "development" ? "mock" : "disabled";

export const scheduleV2Mode: ScheduleV2Mode =
  configuredMode === "mock" || configuredMode === "live" || configuredMode === "disabled"
    ? configuredMode
    : fallbackMode;

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/api/v1";

export class ScheduleV2UnavailableError extends Error {
  constructor() {
    super("일정 생성 V2 백엔드가 아직 활성화되지 않았습니다.");
    this.name = "ScheduleV2UnavailableError";
  }
}

export function assertScheduleV2Available() {
  if (scheduleV2Mode === "disabled") {
    throw new ScheduleV2UnavailableError();
  }
}
