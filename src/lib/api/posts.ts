import type { CreatePostRequest, FeedResponse, PostDetail } from "@/types/api/post";
import { apiBaseUrl } from "./config";
import { ApiError } from "./axios";
import apiClient from "./axios";

type FeedParams = {
  cursor?: number;
  size?: number;
  feed?: string;
  placeId?: number;
  hashtag?: string;
};

type UploadedMedia = {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
};

export async function uploadMedia(files: File[], userId: string): Promise<UploadedMedia[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }

  const { data } = await apiClient.post<{ items: UploadedMedia[] }>("/media", form, {
    headers: { "X-User-Id": userId },
  });
  return data.items;
}

export async function getFeed(params: FeedParams = {}, userId?: string) {
  const { data } = await apiClient.get<FeedResponse>("/posts", {
    params,
    headers: userId ? { "X-User-Id": userId } : {},
  });
  return data;
}

export async function getPost(postId: number, userId?: string) {
  const { data } = await apiClient.get<PostDetail>(`/posts/${postId}`, {
    headers: userId ? { "X-User-Id": userId } : {},
  });
  return data;
}

export async function createPost(body: CreatePostRequest, userId: string) {
  const { data } = await apiClient.post<PostDetail>("/posts", body, {
    headers: { "X-User-Id": userId },
  });
  return data;
}

export { ApiError, apiBaseUrl };
