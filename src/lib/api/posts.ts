import type { CommentListResponse, CreatePostRequest, FeedPost, FeedResponse, PostComment, PostDetail, LikeResponse } from "@/types/api/post";
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

export async function uploadMedia(files: File[]): Promise<UploadedMedia[]> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }

  const { data } = await apiClient.post<{ mediaList: UploadedMedia[] }>("/media", form);
  return data.mediaList;
}

export async function getFeed(params: FeedParams = {}) {
  const { data } = await apiClient.get<FeedResponse>("/posts", { params });
  return data;
}

export async function getPopularFeed(params: { page?: number; size?: number } = {}) {
  const { data } = await apiClient.get<FeedResponse>("/posts/popular", { params });
  return data;
}

export async function getPost(postId: number) {
  const { data } = await apiClient.get<PostDetail>(`/posts/${postId}`);
  return data;
}

export async function createPost(body: CreatePostRequest) {
  const { data } = await apiClient.post<PostDetail>("/posts", body);
  return data;
}

export async function deletePost(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}`);
}

export async function getComments(postId: number, params: { cursor?: number; size?: number } = {}): Promise<CommentListResponse> {
  const { data } = await apiClient.get<CommentListResponse>(`/posts/${postId}/comments`, { params });
  return data;
}

export async function createComment(postId: number, body: { content: string; parentId?: number }): Promise<PostComment> {
  const { data } = await apiClient.post<PostComment>(`/posts/${postId}/comments`, body);
  return data;
}

export async function getMyBookmarks(params: { page?: number; size?: number } = {}): Promise<{ items: FeedPost[] }> {
  const { data } = await apiClient.get<{ items: FeedPost[] }>("/users/me/bookmarks", { params });
  return data;
}

export async function bookmarkPost(postId: number): Promise<{ bookmarked: boolean }> {
  const { data } = await apiClient.post<{ bookmarked: boolean }>(`/posts/${postId}/bookmarks`, null);
  return data;
}

export async function unbookmarkPost(postId: number): Promise<{ bookmarked: boolean }> {
  const { data } = await apiClient.delete<{ bookmarked: boolean }>(`/posts/${postId}/bookmarks`);
  return data;
}

export async function likeComment(postId: number, commentId: number): Promise<LikeResponse> {
  const { data } = await apiClient.post<LikeResponse>(`/posts/${postId}/comments/${commentId}/likes`, null);
  return data;
}

export async function unlikeComment(postId: number, commentId: number): Promise<LikeResponse> {
  const { data } = await apiClient.delete<LikeResponse>(`/posts/${postId}/comments/${commentId}/likes`);
  return data;
}

export async function likePost(postId: number): Promise<LikeResponse> {
  const { data } = await apiClient.post<LikeResponse>(`/posts/${postId}/likes`, null);
  return data;
}

export async function unlikePost(postId: number): Promise<LikeResponse> {
  const { data } = await apiClient.delete<LikeResponse>(`/posts/${postId}/likes`);
  return data;
}

export { ApiError, apiBaseUrl };
