import type { CreatePostRequest, FeedResponse, PostDetail } from "@/types/api/post";
import { apiBaseUrl } from "./config";
import { ApiError } from "./client";
import { requestJson } from "./client";

type UploadedMedia = {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
};

export async function uploadMedia(files: File[], userId: string): Promise<UploadedMedia[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }

  const response = await fetch(`${apiBaseUrl}/media`, {
    method: "POST",
    headers: { "X-User-Id": userId },
    body: form,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({
      code: "UPLOAD_ERROR",
      message: "이미지 업로드에 실패했습니다.",
    }));
    throw new ApiError(response.status, payload);
  }

  const data = (await response.json()) as { items: UploadedMedia[] };
  return data.items;
}

type FeedParams = {
  cursor?: number;
  size?: number;
  feed?: string;
  placeId?: number;
  hashtag?: string;
};

function buildQuery(params: Record<string, string | number | undefined>) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export function getFeed(params: FeedParams = {}, userId?: string) {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  return requestJson<FeedResponse>(`/posts${query}`, {
    headers: userId ? { "X-User-Id": userId } : {},
  });
}

export function getPost(postId: number, userId?: string) {
  return requestJson<PostDetail>(`/posts/${postId}`, {
    headers: userId ? { "X-User-Id": userId } : {},
  });
}

export function createPost(body: CreatePostRequest, userId: string) {
  return requestJson<PostDetail>("/posts", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "X-User-Id": userId },
  });
}
