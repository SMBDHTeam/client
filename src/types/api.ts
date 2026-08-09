

export type LocationPoint = {
  name: string;
  longitude: number;
  latitude: number;
};

export type ApiErrorCode =
  | "INVALID_SCHEDULE_CONDITION"
  | "SCHEDULE_NOT_FOUND"
  | "PLACE_NOT_FOUND"
  | "SHARE_LINK_NOT_FOUND"
  | "TRANSIT_ROUTE_NOT_FOUND"
  | "FACILITY_TYPE_NOT_SUPPORTED"
  | "EXTERNAL_PROVIDER_UNAVAILABLE";

export type ApiFieldError = {
  field: string;
  message: string;
};

export type ApiErrorBody = {
  code: ApiErrorCode | string;
  message: string;
  fieldErrors: ApiFieldError[];
  traceId: string;
};

export type RiskLevel = "NORMAL" | "NOTICE" | "WARNING";
export type TransitMode = "WALK" | "BUS" | "SUBWAY";
export type RealtimeStatus = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";
export type RouteType = "INBOUND" | "FINAL";

export type ItemsResponse<T> = { items: T[] };


export type TripAnswer = {
  id: string;
  label: string;
  displayOrder: number;
};

export type TripQuestion = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  uiStep: number;
  displayOrder: number;
  answers: TripAnswer[];
};

export type TripQuestionsResponse = ItemsResponse<TripQuestion>;


export type LocationSearchItem = {
  name: string;
  address: string | null;
  longitude: number;
  latitude: number;
  externalId: string;
  source: string;
};

export type LocationSearchResponse = ItemsResponse<LocationSearchItem>;


export type OperatingInfo = {
  openingHoursText: string | null;
  closedDaysText: string | null;
  useFeeText?: string | null;
  parkingText?: string | null;
  requiresManualCheck: boolean;
};

export type PlaceImage = {
  url: string;
  thumbnailUrl: string | null;
  copyrightType: string | null;
};

export type PlaceSummary = {
  id: number;
  placeId: number;
  source: string;
  externalId: string;
  externalContentId: string;
  name: string;
  category: string | null;
  categoryLabel: string | null;
  address: string | null;
  longitude: number;
  latitude: number;
  distanceMeters: number | null;
  primaryImageUrl: string | null;
  placeUrl: string | null;
  resolved: boolean;
};

export type PlaceSearchResponse = ItemsResponse<PlaceSummary>;

export type PlaceDetail = {
  id: number;
  externalContentId: string;
  contentTypeId: string | null;
  name: string;
  address: string | null;
  longitude: number;
  latitude: number;
  overview: string | null;
  operatingInfo: OperatingInfo | null;
  images: PlaceImage[];
};

export type PlaceSearchParams = {
  keyword?: string;
  longitude?: number;
  latitude?: number;
  radius?: number;
};


export type NearbyFacility = {
  externalId: string;
  type: string;
  name: string;
  address: string | null;
  longitude: number;
  latitude: number;
  distanceMeters: number | null;
  placeUrl: string | null;
  source: string;
};

export type NearbyFacilitiesResponse = ItemsResponse<NearbyFacility>;

export type NearbyFacilitiesParams = {
  types: string;
  radius?: number;
};


export type TransitSegment = {
  order: number;
  mode: TransitMode;
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
  realtimeStatus: RealtimeStatus;
};

export type Transit = {
  routeType: RouteType;
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
  realtimeStatus: RealtimeStatus;
  fallbackUsed: boolean;
  segments: TransitSegment[];
  warnings: string[];
};


export type StopPlace = {
  id: number;
  name: string;
  category: string | null;
  categoryLabel: string | null;
  address: string | null;
  longitude: number;
  latitude: number;
  primaryImageUrl: string | null;
  operatingInfo: OperatingInfo | null;
};

export type ScheduleStop = {
  id: string;
  order: number;
  arriveAt: string;
  departAt: string;
  stayMinutes: number;
  place: StopPlace;
  inboundTransit: Transit | null;
  mealTimeSlot: string | null;
  waitingMinutesBefore: number;
  selectionReasons: string[];
  warnings: string[];
};

export type ScheduleDay = {
  dayNo: number;
  date: string;
  startTime: string;
  endTime: string;
  startLocation: LocationPoint;
  endLocation: LocationPoint;
  startLocationSource: string | null;
  endLocationSource: string | null;
  summary: string | null;
  stops: ScheduleStop[];
  finalTransit: Transit | null;
};

export type EvaluationMetric = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  reason: string;
};

export type Evaluation = {
  hardGate: {
    passed: boolean;
    violations: string[];
  };
  qualityScore: {
    totalScore: number;
    maxScore: number;
    metrics: EvaluationMetric[];
  };
  operations: Record<string, number | string[]>;
};

export type Schedule = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  dailyStartTime: string;
  dailyEndTime: string;
  styleSummary: string | null;
  days: ScheduleDay[];
  evaluation?: Evaluation;
};

export type ScheduleListItem = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  styleSummary: string | null;
  days: ScheduleDay[];
};

export type ScheduleListResponse = ItemsResponse<ScheduleListItem>;


export type SelectedAnswer = {
  questionId: string;
  answerIds: string[];
};

export type CreateScheduleDay = {
  dayNo: number;
  startTime: string;
  endTime: string;
  startLocation: LocationPoint;
  endLocation: LocationPoint;
};

export type CreateScheduleRequest = {
  startDate: string;
  endDate: string;
  startLocation: LocationPoint;
  lodgingPlan: unknown[];
  selectedAnswers: SelectedAnswer[];
  mustVisitPlaces?: LocationPoint[];
  fixedEvents: unknown[];
  dayOverrides: unknown[];
  days?: CreateScheduleDay[];
};


export type UpdateScheduleStop = {
  stopId?: string;
  placeId?: number;
  dayNo: number;
  order: number;
  stayMinutes: number;
};

export type UpdateScheduleRequest = {
  stops: UpdateScheduleStop[];
};


export type MapMarker = {
  dayNo: number;
  order: number;
  placeId: number;
  name: string;
  arriveAt: string;
  departAt: string;
  subtitle: string | null;
  riskLevel: RiskLevel;
  longitude: number;
  latitude: number;
};

export type RouteLine = {
  dayNo: number;
  routeOrder: number;
  lineOrder: number;
  mode: TransitMode;
  lineName: string | null;
  startName: string;
  endName: string;
  durationMinutes: number | null;
  distanceMeters: number | null;
  instruction: string | null;
  fallbackUsed: boolean;
  coordinates: [number, number][];
};

export type ScheduleMap = {
  startMarker: LocationPoint;
  endMarker: LocationPoint;
  markers: MapMarker[];
  routeLines: RouteLine[];
};


export type CreateShareRequest = {
  expiresInDays?: number;
};

export type Share = {
  id: string;
  token: string;
  url: string;
  expiresAt: string | null;
};

export type SharedSchedule = {
  id: string;
  status: string;
  readOnly: true;
  days: ScheduleDay[];
};
