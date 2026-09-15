import type { LocationInput } from "./common";
import type { ScheduleTransit } from "./schedule";

export type SharedScheduleStop = {
  stopId: string;
  placeId: number;
  dayNo: number;
  order: number;
  stayMinutes: number;
  referenceValid: boolean;
};

export type SharedScheduleDay = {
  dayNo: number;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: LocationInput | null;
  endLocation: LocationInput | null;
  startLocationSource: string | null;
  endLocationSource: string | null;
  summary: string;
  stops: SharedScheduleStop[];
  finalTransit: ScheduleTransit | null;
};

export type SharedScheduleResponse = {
  id: string;
  status: string;
  readOnly: boolean;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  styleSummary: string;
  days: SharedScheduleDay[];
};

export type ShareLink = {
  id: string;
  token: string;
  url: string;
  expiresAt: string;
};
