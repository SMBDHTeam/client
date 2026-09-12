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
  mode: string;
  lineName: string | null;
  startStationId: string | null;
  startStationName: string | null;
  endStationId: string | null;
  endStationName: string | null;
  instruction: string | null;
  durationMinutes: number;
  distanceMeters: number | null;
  stationCount: number | null;
  waitMinutes: number;
  realtimeStatus: string;
};

export type ScheduleTransit = {
  routeType: string | null;
  routeOrder: number;
  originName: string | null;
  destinationName: string | null;
  summary: string | null;
  departAt: string | null;
  arriveAt: string | null;
  departAtDateTime?: string | null;
  arriveAtDateTime?: string | null;
  totalMinutes: number;
  walkMinutes: number;
  waitMinutes: number;
  transferCount: number;
  fareAmount: number | null;
  provider: string | null;
  realtimeStatus: string;
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
  arriveAtDateTime?: string | null;
  departAtDateTime?: string | null;
  role?: string | null;
  themes?: string[];
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
  scheduleType?: string;
  transportMode?: string | null;
  startAt?: string | null;
  returnBy?: string | null;
  estimatedReturnAt?: string | null;
  spontaneousMetadata?: Record<string, unknown> | null;
  days: ScheduleDay[];
};
