
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

type PlaceSearchResponse = { items: PlaceSummary[] };

type PlaceSearchParams = {
  longitude?: number;
  latitude?: number;
  radius?: number;
  keyword?: string;
};

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

export async function searchPlaces(
  params: PlaceSearchParams,
): Promise<PlaceSearchResponse> {
  const res = await fetch(`/api/v1/places${qs({ ...params })}`);
  if (!res.ok) throw new Error(`장소 검색 실패 (${res.status})`);
  return res.json();
}
