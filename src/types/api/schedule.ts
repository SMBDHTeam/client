import type { LocationInput } from "./common";

export type SchedulePlace = LocationInput & {
  id: number;
  category: string;
  categoryLabel: string;
  address: string;
  primaryImageUrl?: string | null;
};

export type ScheduleTransitSegment = {
  order: number;
  mode: "WALK" | "BUS" | "SUBWAY" | "TRAIN";
  lineName: string | null;
  startStationId: string | null;
  startStationName: string | null;
  endStationId: string | null;
  endStationName: string | null;
  instruction: string;
  durationMinutes: number;
  distanceMeters: number | null;
  stationCount: number | null;
  waitMinutes: number;
  realtimeStatus: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";
};

export type ScheduleTransit = {
  routeType: "INBOUND" | "FINAL";
  routeOrder: number;
  originName: string;
  destinationName: string;
  summary: string;
  departAt: string;
  arriveAt: string;
  totalMinutes: number;
  walkMinutes: number;
  waitMinutes: number;
  transferCount: number;
  fareAmount: number | null;
  provider: string;
  realtimeStatus: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";
  fallbackUsed: boolean;
  segments: ScheduleTransitSegment[];
  warnings: string[];
};

export type ScheduleStop = {
  id: string;
  order: number;
  arriveAt: string;
  departAt: string;
  stayMinutes: number;
  place: SchedulePlace;
  inboundTransit: ScheduleTransit | null;
  mealTimeSlot: "LUNCH" | "DINNER" | null;
  waitingMinutesBefore: number;
  selectionReasons?: string[];
  warnings?: string[];
};

export type ScheduleDay = {
  dayNo: number;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: LocationInput | null;
  endLocation: LocationInput | null;
  startLocationSource: string | null;
  endLocationSource: "LAST_STOP" | "PLANNER_DECIDES" | "USER_CONSTRAINT" | string | null;
  summary: string;
  stops: ScheduleStop[];
  finalTransit: ScheduleTransit | null;
};

export type ScheduleLongTransitWarning = {
  dayNo: number;
  routeOrder: number;
  originName: string;
  destinationName: string;
  totalMinutes: number;
};

export type ScheduleSummary = {
  id: string;
  status: "CONFIRMED";
  startDate: string;
  endDate: string;
  styleSummary: string;
  dayCount: number;
  stopCount: number;
  previewPlaceNames: string[];
};

export type ScheduleListResponse = {
  items: ScheduleSummary[];
};

export type ScheduleResponse = {
  id: string;
  previewId?: string;
  status: "CONFIRMED";
  startDate: string;
  endDate: string;
  styleSummary: string;
  evaluation?: {
    qualityScore: {
      totalScore: number;
      maxScore: number;
      evaluationCoveragePercent: number;
      unusedMinutes: number;
      longTransitWarnings: ScheduleLongTransitWarning[];
      routeConfidence: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
    };
  };
  planningAssumptions?: {
    timeZone: "Asia/Seoul";
    lodgingMode: "UNDECIDED" | "FIXED_BASE" | "PER_NIGHT";
    routeCoverage: "FULL" | "ATTRACTION_ROUTES_ONLY";
    warnings: string[];
  };
  days: ScheduleDay[];
};
