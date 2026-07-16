import type { LocationInput } from "@/types/api/common";
import { requestJson } from "./client";
import { assertScheduleV2Available, scheduleV2Mode } from "./config";
import { mockSearchLocations } from "./mock-schedule-v2";

type LocationSearchResponse = { items: LocationInput[] };

async function searchNaverLocations(keyword: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/locations/search?keyword=${encodeURIComponent(keyword)}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error("장소를 검색하지 못했습니다.");
  }
  return (await response.json()) as LocationSearchResponse;
}

async function searchLiveLocations(keyword: string, signal?: AbortSignal) {
  try {
    return await requestJson<LocationSearchResponse>(
      `/locations/search?keyword=${encodeURIComponent(keyword)}&size=10`,
      { signal },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    return searchNaverLocations(keyword, signal);
  }
}

export async function searchLocations(keyword: string, signal?: AbortSignal) {
  assertScheduleV2Available();
  const response =
    scheduleV2Mode === "mock"
      ? await searchNaverLocations(keyword, signal).catch(() =>
          mockSearchLocations(keyword),
        )
      : await searchLiveLocations(keyword, signal);

  return {
    items: response.items.map((item) => ({
      name: item.name,
      address: item.address,
      longitude: item.longitude,
      latitude: item.latitude,
    })),
  };
}
