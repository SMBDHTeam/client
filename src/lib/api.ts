
import type {
  CreateScheduleRequest,
  CreateShareRequest,
  LocationSearchResponse,
  NearbyFacilitiesParams,
  NearbyFacilitiesResponse,
  PlaceDetail,
  PlaceSearchParams,
  PlaceSearchResponse,
  Schedule,
  ScheduleListResponse,
  ScheduleMap,
  Share,
  SharedSchedule,
  TripQuestionsResponse,
  UpdateScheduleRequest,
  ApiErrorBody,
} from "@/types/api";

const BASE = "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly traceId?: string;
  readonly fieldErrors?: ApiErrorBody["fieldErrors"];

  constructor(status: number, body?: Partial<ApiErrorBody>) {
    super(body?.message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code ?? "UNKNOWN";
    this.traceId = body?.traceId;
    this.fieldErrors = body?.fieldErrors;
  }
}

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let body: Partial<ApiErrorBody> | undefined;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}


export function getTripQuestions(): Promise<TripQuestionsResponse> {
  return apiFetch("/trip-questions");
}

export async function searchLocations(
  keyword: string,
  size?: number,
): Promise<LocationSearchResponse> {
  const res = await fetch(`/api/locations/search${qs({ keyword, size })}`);
  if (!res.ok) throw new ApiError(res.status);
  return res.json();
}

export function createSchedule(body: CreateScheduleRequest): Promise<Schedule> {
  return apiFetch("/schedules", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getSchedules(): Promise<ScheduleListResponse> {
  return apiFetch("/schedules");
}

export function updateSchedule(
  scheduleId: string,
  body: UpdateScheduleRequest,
): Promise<Schedule> {
  return apiFetch(`/schedules/${scheduleId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function searchPlaces(
  params: PlaceSearchParams,
): Promise<PlaceSearchResponse> {
  return apiFetch(`/places${qs({ ...params })}`);
}

export function getPlace(placeId: number): Promise<PlaceDetail> {
  return apiFetch(`/places/${placeId}`);
}

export function getNearbyFacilities(
  placeId: number,
  params: NearbyFacilitiesParams,
): Promise<NearbyFacilitiesResponse> {
  return apiFetch(`/places/${placeId}/nearby-facilities${qs({ ...params })}`);
}

export function getScheduleMap(
  scheduleId: string,
  dayNo?: number,
): Promise<ScheduleMap> {
  return apiFetch(`/schedules/${scheduleId}/map${qs({ dayNo })}`);
}

export function createShare(
  scheduleId: string,
  body?: CreateShareRequest,
): Promise<Share> {
  return apiFetch(`/schedules/${scheduleId}/shares`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export function getSharedSchedule(token: string): Promise<SharedSchedule> {
  return apiFetch(`/shared-schedules/${token}`);
}

export function getSharedScheduleMap(
  token: string,
  dayNo?: number,
): Promise<ScheduleMap> {
  return apiFetch(`/shared-schedules/${token}/map${qs({ dayNo })}`);
}

export function revokeShare(
  scheduleId: string,
  shareId: string,
): Promise<void> {
  return apiFetch(`/schedules/${scheduleId}/shares/${shareId}`, {
    method: "DELETE",
  });
}
