import type { LocationInput } from "@/types/api/common";
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

export async function searchLocations(keyword: string, signal?: AbortSignal) {
  assertScheduleV2Available();
  // 출발지는 네이버 지역검색만 쓴다. 이전에는 백엔드(Kakao)를 먼저 호출하고
  // 실패할 때만 네이버로 넘어가서, 외부 Provider 장애가 그대로 드러났다.
  const response =
    scheduleV2Mode === "mock"
      ? await searchNaverLocations(keyword, signal).catch(() =>
          mockSearchLocations(keyword),
        )
      : await searchNaverLocations(keyword, signal);

  return {
    items: response.items.map((item) => ({
      name: item.name,
      address: item.address,
      longitude: item.longitude,
      latitude: item.latitude,
    })),
  };
}
