/**
 * 장소 위시리스트 API 타입. 서버의 `com.server.wishlist.dto` 와 짝을 이룬다.
 */

export type WishlistPlace = {
  placeId: number;
  name: string;
  /** 저장된 원본 분류. TourAPI 코드나 카카오 경로가 그대로 온다. 없는 장소가 있다 */
  category: string | null;
  /** 화면에 보일 분류 이름. 서버가 아직 주지 않는 버전이 있어 선택 필드다 */
  categoryLabel?: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  /** 대표 이미지. 없는 장소가 많다 */
  primaryImageUrl: string | null;
};

/** 최근에 담은 순. 담은 뒤 관리자가 가린 장소는 빠진다 */
export type WishlistListResponse = {
  items: WishlistPlace[];
};

/** 담기·빼기 후 상태 */
export type WishlistToggleResponse = {
  wishlisted: boolean;
};
