import apiClient from "./axios";
import type { FeedResponse } from "@/types/api/post";

export type UserProfile = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  following: boolean;
  me: boolean;
};

export type UserSummary = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export async function getUserProfile(userId: number, requesterId?: string): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>(`/users/${userId}/profile`, {
    headers: requesterId ? { "X-User-Id": requesterId } : {},
  });
  return data;
}

export async function getUserPosts(userId: number, params: { cursor?: number; size?: number } = {}, requesterId?: string): Promise<FeedResponse> {
  const { data } = await apiClient.get<FeedResponse>(`/users/${userId}/posts`, {
    params,
    headers: requesterId ? { "X-User-Id": requesterId } : {},
  });
  return data;
}

export async function updateNickname(nickname: string, userId: string): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/users/me/nickname", { nickname }, {
    headers: { "X-User-Id": userId },
  });
  return data;
}

export async function updateProfileImage(profileImageUrl: string, userId: string): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/users/me/profile-image", { profileImageUrl }, {
    headers: { "X-User-Id": userId },
  });
  return data;
}

export async function deleteProfileImage(userId: string): Promise<UserProfile> {
  const { data } = await apiClient.delete<UserProfile>("/users/me/profile-image", {
    headers: { "X-User-Id": userId },
  });
  return data;
}

export async function followUser(userId: number, requesterId: string): Promise<{ followerCount: number; following: boolean }> {
  const { data } = await apiClient.post(`/users/${userId}/follows`, null, {
    headers: { "X-User-Id": requesterId },
  });
  return data;
}

export async function unfollowUser(userId: number, requesterId: string): Promise<{ followerCount: number; following: boolean }> {
  const { data } = await apiClient.delete(`/users/${userId}/follows`, {
    headers: { "X-User-Id": requesterId },
  });
  return data;
}

export async function getFollowings(userId: number, params: { page?: number; size?: number } = {}): Promise<{ items: UserSummary[]; totalCount: number }> {
  const { data } = await apiClient.get(`/users/${userId}/followings`, { params });
  return data;
}

export async function getFollowers(userId: number, params: { page?: number; size?: number } = {}): Promise<{ items: UserSummary[]; totalCount: number }> {
  const { data } = await apiClient.get(`/users/${userId}/followers`, { params });
  return data;
}
