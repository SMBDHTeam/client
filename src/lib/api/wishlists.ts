import apiClient from "./axios";
import type { WishlistListResponse, WishlistToggleResponse } from "@/types/api/wishlist";

/** 서버가 허용하는 한 페이지 최대 크기. 담긴 상태 확인도 이 범위 안에서만 한다 */
export const WISHLIST_MAX_PAGE_SIZE = 50;

export async function addWishlist(placeId: number): Promise<WishlistToggleResponse> {
  const { data } = await apiClient.post<WishlistToggleResponse>(`/places/${placeId}/wishlists`, null);
  return data;
}

export async function removeWishlist(placeId: number): Promise<WishlistToggleResponse> {
  const { data } = await apiClient.delete<WishlistToggleResponse>(`/places/${placeId}/wishlists`);
  return data;
}

export async function getMyWishlist(
  params: { page?: number; size?: number } = {},
): Promise<WishlistListResponse> {
  const { data } = await apiClient.get<WishlistListResponse>("/users/me/wishlists", {
    params: { size: WISHLIST_MAX_PAGE_SIZE, ...params },
  });
  return data;
}
