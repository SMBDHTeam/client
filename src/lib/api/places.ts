import type {
  PlaceDetail,
  PlaceSearchItem,
  PlaceSearchResponse,
  PlaceSummary,
  ResolvedPlace,
} from "@/types/api/place";
import apiClient from "./axios";

export async function getPlaceDetail(placeId: number) {
  const { data } = await apiClient.get<PlaceDetail>(`/places/${placeId}`);
  return data;
}

async function enrichPlaceImages(items: PlaceSearchItem[], signal?: AbortSignal) {
  if (items.length === 0 || items.every((item) => item.primaryImageUrl)) return items;

  try {
    const response = await fetch("/api/places/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names: items.map((item) => item.name) }),
      signal,
    });
    if (!response.ok) return items;

    const payload = (await response.json()) as {
      items: { name: string; primaryImageUrl: string | null }[];
    };
    const imagesByName = new Map(
      payload.items.map((item) => [item.name, item.primaryImageUrl]),
    );
    return items.map((item) => ({
      ...item,
      primaryImageUrl: item.primaryImageUrl ?? imagesByName.get(item.name) ?? null,
    }));
  } catch {
    return items;
  }
}

export async function searchPlaces(keyword: string, signal?: AbortSignal) {
  const query = encodeURIComponent(keyword);

  try {
    const response = await fetch(`/api/places/search?keyword=${query}`, { signal });
    if (!response.ok) throw new Error("장소를 검색하지 못했습니다.");
    const payload = (await response.json()) as PlaceSearchResponse;
    if (payload.items.length > 0) {
      return { items: await enrichPlaceImages(payload.items, signal) };
    }
  } catch (cause) {
    if (signal?.aborted) throw cause;
  }

  const { data } = await apiClient.get<PlaceSearchResponse>(
    `/places?keyword=${query}&scope=INTERNAL&size=20`,
    { signal },
  );
  return data;
}

export async function resolvePlace(place: PlaceSearchItem) {
  if (place.placeId !== null && place.resolved) {
    return Promise.resolve({
      ...place,
      placeId: place.placeId,
      resolved: true,
      operatingInfoAvailable: true,
    } satisfies ResolvedPlace);
  }
  const { data } = await apiClient.post<ResolvedPlace>("/places/resolve", {
    source: place.source,
    externalId: place.externalId,
    name: place.name,
    category: place.category,
    address: place.address,
    longitude: place.longitude,
    latitude: place.latitude,
    placeUrl: place.placeUrl,
  });
  return data;
}

type PlaceGeoSearchParams = {
  longitude?: number;
  latitude?: number;
  radius?: number;
  keyword?: string;
};

export async function searchPlacesGeo(params: PlaceGeoSearchParams): Promise<{ items: PlaceSummary[] }> {
  const res = await fetch(`/api/v1/places${buildQs(params)}`);
  if (!res.ok) throw new Error(`장소 검색 실패 (${res.status})`);
  return res.json();
}

function buildQs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}
