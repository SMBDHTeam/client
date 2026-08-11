import type { LocationInput } from "@/types/api/common";

type LocationSearchResponse = { items: LocationInput[] };

export async function searchLocations(keyword: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/locations/search?keyword=${encodeURIComponent(keyword)}`,
    { signal },
  );
  if (!response.ok) throw new Error("장소를 검색하지 못했습니다.");
  const data = (await response.json()) as LocationSearchResponse;
  return {
    items: data.items.map((item) => ({
      name: item.name,
      address: item.address,
      longitude: item.longitude,
      latitude: item.latitude,
    })),
  };
}
