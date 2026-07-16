import type { LocationInput } from "./common";
import type { PlaceSearchItem } from "./place";

export type SelectedAnswerInput = {
  questionId: string;
  answerIds: string[];
};

export type LodgingPlanInput =
  | { mode: "UNDECIDED" }
  | { mode: "FIXED_BASE"; baseLocation: LocationInput }
  | {
      mode: "PER_NIGHT";
      nightStays: Array<{ date: string; location: LocationInput }>;
    };

export type EndConstraintInput = {
  type: "ARRIVE_BY" | "TRAIN_DEPARTURE" | "FLIGHT_DEPARTURE";
  location: LocationInput;
  targetAt: string;
  bufferMinutes?: number;
};

export type DayOverrideInput = {
  date: string;
  availableFrom?: string;
  availableUntil?: string;
  startLocation?: LocationInput;
  endLocation?: LocationInput;
};

export type FixedEventInput = {
  clientEventId: string;
  name: string;
  placeId: number;
  startsAt: string;
  endsAt: string;
};

export type TripDraft = {
  startDate?: string;
  endDate?: string;
  startLocation?: LocationInput;
  startTime?: string;
  lodgingPlan: LodgingPlanInput;
  endConstraint?: EndConstraintInput;
  selectedAnswers: SelectedAnswerInput[];
  mustVisitPlaceIds: number[];
  fixedEvents: FixedEventInput[];
  dayOverrides: DayOverrideInput[];
  customPrompt?: string;
  previewId?: string;
  previewExpiresAt?: string;
  idempotencyKey?: string;
};

export type TripDraftState = TripDraft & {
  selectedPlaces: PlaceSearchItem[];
};

export type PreviewConflict = {
  code: string;
  message: string;
  fieldPath?: string | null;
  conflictDate?: string | null;
  requiredMinutes?: number | null;
  availableMinutes?: number | null;
  adjustableFields: string[];
};

export type ResolvedDay = {
  date: string;
  availableFrom: string;
  availableUntil: string;
  startLocation: LocationInput | null;
  endLocation: LocationInput | null;
  startLocationSource: "USER" | "LODGING" | "DAY_OVERRIDE" | "PLANNER_DECIDES";
  endLocationSource: "LODGING" | "END_CONSTRAINT" | "DAY_OVERRIDE" | "PLANNER_DECIDES";
};

export type SchedulePreview = {
  previewId: string;
  status: "READY" | "REQUIRES_ACTION" | "EXPIRED" | "CONSUMED";
  canGenerate: boolean;
  expiresAt: string;
  timeZone: "Asia/Seoul";
  lodgingMode: LodgingPlanInput["mode"];
  routeCoverage: "FULL" | "ATTRACTION_ROUTES_ONLY";
  resolvedDays: ResolvedDay[];
  resolvedEndConstraint?: {
    type: EndConstraintInput["type"];
    targetAt: string;
    appliedBufferMinutes: number;
    availableUntil: string;
  };
  appliedDefaults: Array<{
    fieldPath: string;
    resolvedValue: unknown;
    reasonCode: string;
  }>;
  interpretedPrompt: {
    preferences: string[];
    unrecognizedTexts: string[];
    source: "RULE_BASED" | "HYBRID_AI" | "FALLBACK";
    confidence: number;
  };
  warnings: Array<{ code: string; date?: string | null; message: string }>;
  conflicts: PreviewConflict[];
  scheduleId?: string;
};

export type CreateSchedulePreviewRequest = Omit<
  TripDraft,
  "previewId" | "previewExpiresAt" | "idempotencyKey"
>;
