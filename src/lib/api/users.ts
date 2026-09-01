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

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>(`/users/${userId}/profile`);
  return data;
}

export async function getUserPosts(userId: number, params: { cursor?: number; size?: number } = {}): Promise<FeedResponse> {
  const { data } = await apiClient.get<FeedResponse>(`/users/${userId}/posts`, { params });
  return data;
}

export async function updateNickname(nickname: string): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/users/me/nickname", { nickname });
  return data;
}

export async function updateProfileImage(profileImageUrl: string): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>("/users/me/profile-image", { profileImageUrl });
  return data;
}

export async function deleteProfileImage(): Promise<UserProfile> {
  const { data } = await apiClient.delete<UserProfile>("/users/me/profile-image");
  return data;
}

export async function followUser(userId: number): Promise<{ followerCount: number; following: boolean }> {
  const { data } = await apiClient.post(`/users/${userId}/follows`, null);
  return data;
}

export async function unfollowUser(userId: number): Promise<{ followerCount: number; following: boolean }> {
  const { data } = await apiClient.delete(`/users/${userId}/follows`);
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
