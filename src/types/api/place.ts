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
  source: PlaceSource;
  externalContentId: string;
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
  /** 내 위시리스트에 담겼는지. 로그인하지 않았으면 null. 아직 주지 않는 서버 버전이 있어 선택 필드다 */
  wishlisted?: boolean | null;
};

/** 카카오맵 장소 페이지 주소. matched 가 false 면 url 은 이름 검색 결과 페이지다 */
export type PlaceKakaoLink = {
  placeId: number;
  kakaoPlaceId: string | null;
  url: string;
  matched: boolean;
};
