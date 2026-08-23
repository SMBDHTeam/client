import type { LocationInput } from "./common";

export type PlaceSource = "TOUR_API" | "KAKAO_LOCAL" | "NAVER_LOCAL";

export type PlaceSearchItem = LocationInput & {
  placeId: number | null;
  source: PlaceSource;
  externalId: string;
  category: string;
  categoryLabel: string;
  primaryImageUrl: string | null;
  placeUrl?: string | null;
  resolved: boolean;
};

export type PlaceSearchResponse = {
  items: PlaceSearchItem[];
};

export type ResolvedPlace = PlaceSearchItem & {
  placeId: number;
  resolved: true;
  operatingInfoAvailable: boolean;
};

export type PlaceSummary = {
  id: number;
  placeId: number;
  source: string;
  externalId: string;
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

export type PlaceOperatingInfo = {
  openingHoursText: string | null;
  closedDaysText: string | null;
  useFeeText: string | null;
  parkingText: string | null;
  requiresManualCheck: boolean;
};

export type PlaceImage = {
  url: string;
  thumbnailUrl: string | null;
  copyrightType: string | null;
};

export type PlaceDetail = {
  id: number;
  name: string;
  category: string | null;
  categoryLabel: string | null;
  address: string | null;
  longitude: number;
  latitude: number;
  placeUrl: string | null;
  primaryImageUrl: string | null;
  overview: string | null;
  operatingInfo: PlaceOperatingInfo | null;
  images: PlaceImage[];
};
