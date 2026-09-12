import type { ScheduleTransit } from "./schedule";
import type { ScheduleRouteLine } from "./schedule-map";

export type TransportMode = "PUBLIC_TRANSIT" | "WALK" | "CAR";

export type TravelTheme =
  | "SEA"
  | "SEAFOOD"
  | "FOOD"
  | "CAFE"
  | "WALK"
  | "NIGHT_VIEW"
  | "CULTURE"
  | "SHOPPING"
  | "HEALING"
  | "NATURE"
  | "ACTIVITY";

export type CourseRole = "ACTIVITY" | "MEAL" | "CAFE" | "NIGHT_VIEW";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type CourseStartLocation = Coordinate & {
  name: string | null;
  address: string | null;
};

export type StartLocationItem = {
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  externalId: string;
  source: string;
};

export type StartLocationsResponse = {
  items: StartLocationItem[];
};

export type DestinationTransport = {
  mode: TransportMode;
  outboundMinutes: number;
  returnMinutes: number;
  availableStayMinutes: number;
};

export type Destination = {
  destinationId: string;
  name: string;
  themeScore: number;
  distanceMeters: number;
  transport: DestinationTransport;
};

export type DestinationsRequest = {
  startLocation: Coordinate;
  startAt: string;
  returnBy: string;
  transportMode: TransportMode;
  desiredThemes: TravelTheme[];
};

export type DestinationsResponse = {
  destinations: Destination[];
};

export type SpontaneousCoursePlace = {
  id: null;
  name: string;
  category: string | null;
  categoryLabel: string;
  address: string | null;
  longitude: number | null;
  latitude: number | null;
  primaryImageUrl: string | null;
  operatingInfo: null;
};

export type SpontaneousCourseStop = {
  order: number;
  role: CourseRole;
  name: string;
  contentId: string | null;
  contentTypeId: string | null;
  latitude: number;
  longitude: number;
  travelMinutesFromPrevious: number | null;
  arrivalAt: string | null;
  departureAt: string | null;
  stayMinutes: number;
  themes: TravelTheme[];
  place: SpontaneousCoursePlace | null;
  inboundTransit: ScheduleTransit | null;
};

export type CourseItem = SpontaneousCourseStop;

export type CourseRequest = {
  destinationId: string;
  startLocation: Coordinate;
  startAt: string;
  returnBy: string;
  transportMode: TransportMode;
  desiredThemes: TravelTheme[];
};

export type CourseResponse = {
  destinationId: string;
  name: string;
  transportMode: TransportMode;
  returnTravelMinutes: number | null;
  estimatedReturnAt: string | null;
  returnBy: string | null;
  previewId: string | null;
  previewToken: string | null;
  previewExpiresAt: string | null;
  startLocation: CourseStartLocation | null;
  startAt: string | null;
  course: SpontaneousCourseStop[];
  finalTransit: ScheduleTransit | null;
  routeLines: ScheduleRouteLine[];
};

export type SaveSpontaneousScheduleRequest = {
  previewId: string;
  previewToken: string;
};
