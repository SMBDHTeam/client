export type ScheduleEndpointMarker = {
  name: string;
  longitude: number | null;
  latitude: number | null;
};

export type ScheduleMapMarker = {
  dayNo: number;
  order: number;
  placeId: number | null;
  name: string;
  arriveAt: string | null;
  departAt: string | null;
  arriveAtDateTime?: string | null;
  departAtDateTime?: string | null;
  subtitle: string | null;
  riskLevel: "NORMAL" | "NOTICE" | "WARNING";
  longitude: number | null;
  latitude: number | null;
};

export type ScheduleRouteLine = {
  dayNo: number;
  routeOrder: number;
  lineOrder: number;
  mode: string;
  lineName: string | null;
  startName: string | null;
  endName: string | null;
  durationMinutes: number | null;
  distanceMeters: number | null;
  instruction: string | null;
  fallbackUsed: boolean;
  coordinates: [number, number][];
};

export type ScheduleMapResponse = {
  startMarker: ScheduleEndpointMarker | null;
  endMarker: ScheduleEndpointMarker | null;
  markers: ScheduleMapMarker[];
  routeLines: ScheduleRouteLine[];
};
