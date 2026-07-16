import type { PlaceSearchItem, PlaceSearchResponse, ResolvedPlace } from "@/types/api/place";
import { ApiError, requestJson } from "./client";
import { assertScheduleV2Available, scheduleV2Mode } from "./config";
import { mockResolvePlace, mockSearchPlaces } from "./mock-schedule-v2";

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
  assertScheduleV2Available();
  if (scheduleV2Mode === "mock") {
    const response = await mockSearchPlaces(keyword);
    return { items: await enrichPlaceImages(response.items, signal) };
  }
  const query = encodeURIComponent(keyword);
  try {
    return await requestJson<PlaceSearchResponse>(
      `/places?keyword=${query}&scope=ALL&size=20`,
      { signal },
    );
  } catch (cause) {
    if (
      !(cause instanceof ApiError) ||
      cause.payload.code !== "EXTERNAL_PROVIDER_UNAVAILABLE"
    ) {
      throw cause;
    }

    return requestJson<PlaceSearchResponse>(
      `/places?keyword=${query}&scope=INTERNAL&size=20`,
      { signal },
    );
  }
}

export function resolvePlace(place: PlaceSearchItem) {
  assertScheduleV2Available();
  if (place.placeId !== null && place.resolved) {
    return Promise.resolve({
      ...place,
      placeId: place.placeId,
      resolved: true,
      operatingInfoAvailable: true,
    } satisfies ResolvedPlace);
  }
  if (scheduleV2Mode === "mock") return mockResolvePlace(place);
  return requestJson<ResolvedPlace>("/places/resolve", {
    method: "POST",
    body: JSON.stringify({
      source: place.source,
      externalId: place.externalId,
      name: place.name,
      category: place.category,
      address: place.address,
      longitude: place.longitude,
      latitude: place.latitude,
      placeUrl: place.placeUrl,
    }),
  });
}
