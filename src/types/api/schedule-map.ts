import type { LocationInput } from "./common";

export type ScheduleMapMarker = {
  dayNo: number;
  order: number;
  placeId: number;
  name: string;
  arriveAt: string;
  departAt: string;
  subtitle: string;
  riskLevel: "NORMAL" | "NOTICE" | "WARNING";
  longitude: number;
  latitude: number;
};

export type ScheduleRouteLine = {
  dayNo: number;
  routeOrder: number;
  lineOrder: number;
  mode: "WALK" | "BUS" | "SUBWAY" | "TRAIN";
  lineName: string | null;
  startName: string;
  endName: string;
  durationMinutes: number;
  distanceMeters: number | null;
  instruction: string;
  fallbackUsed: boolean;
  coordinates: [number, number][];
};

export type ScheduleMapResponse = {
  startMarker: LocationInput | null;
  endMarker: LocationInput | null;
  markers: ScheduleMapMarker[];
  routeLines: ScheduleRouteLine[];
};
