import type { ApiErrorPayload } from "@/types/api/common";
import { apiBaseUrl } from "./config";

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({
      code: "UNKNOWN_API_ERROR",
      message: "요청을 처리하지 못했습니다.",
    }))) as ApiErrorPayload;
    throw new ApiError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
