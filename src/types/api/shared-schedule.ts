import type { ScheduleDay } from "./schedule";

export type SharedScheduleResponse = {
  id: string;
  status: string;
  readOnly: boolean;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  styleSummary: string;
  days: ScheduleDay[];
};

export type ShareLink = {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
};
