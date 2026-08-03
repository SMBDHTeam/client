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
