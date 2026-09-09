import axios from "axios";
import { getSession, signIn } from "next-auth/react";
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

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
});

let redirectingToSignIn = false;

function redirectToSignIn() {
  if (typeof window === "undefined" || redirectingToSignIn) return;

  redirectingToSignIn = true;
  void signIn("google", {
    callbackUrl: `${window.location.pathname}${window.location.search}`,
  });
}

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        redirectToSignIn();
      }

      const payload = (error.response.data as ApiErrorPayload | undefined) ?? {
        code: "UNKNOWN_API_ERROR",
        message: "요청을 처리하지 못했습니다.",
        fieldErrors: [],
        traceId: "",
      };
      return Promise.reject(new ApiError(error.response.status, payload));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
