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

export type CourseItem = {
  order: number;
  role: CourseRole;
  name: string;
  contentId: string;
  contentTypeId: string;
  latitude: number;
  longitude: number;
  travelMinutesFromPrevious: number;
  arrivalAt: string;
  departureAt: string;
  stayMinutes: number;
  themes: TravelTheme[];
};

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
  returnTravelMinutes: number;
  estimatedReturnAt: string;
  returnBy: string;
  course: CourseItem[];
};
