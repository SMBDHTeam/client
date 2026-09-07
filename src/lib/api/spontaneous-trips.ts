import apiClient from "./axios";
import type {
  StartLocationsResponse,
  DestinationsRequest,
  DestinationsResponse,
  CourseRequest,
  CourseResponse,
} from "@/types/api/spontaneous-trip";

export async function searchStartLocations(keyword: string, size = 10) {
  const { data } = await apiClient.get<StartLocationsResponse>(
    "/spontaneous-trips/start-locations/search",
    { params: { keyword, size } },
  );
  return data;
}

export async function getDestinations(body: DestinationsRequest) {
  const { data } = await apiClient.post<DestinationsResponse>(
    "/spontaneous-trips/destinations",
    body,
  );
  return data;
}

export async function createCourse(body: CourseRequest) {
  const { data } = await apiClient.post<CourseResponse>(
    "/spontaneous-trips/course",
    body,
  );
  return data;
}
