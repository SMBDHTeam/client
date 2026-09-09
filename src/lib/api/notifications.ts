import type {
  NotificationItem,
  NotificationListResponse,
  UnreadNotificationCountResponse,
} from "@/types/api/notification";
import apiClient from "./axios";

type NotificationListParams = {
  cursor?: number;
  size?: number;
};

export async function getNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  const { data } = await apiClient.get<NotificationListResponse>("/notifications", {
    params,
  });
  return data;
}

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCountResponse> {
  const { data } = await apiClient.get<UnreadNotificationCountResponse>(
    "/notifications/unread-count",
  );
  return data;
}

export async function markNotificationAsRead(
  notificationId: number,
): Promise<NotificationItem> {
  const { data } = await apiClient.patch<NotificationItem>(
    `/notifications/${notificationId}/read`,
  );
  return data;
}

export async function markAllNotificationsAsRead(): Promise<UnreadNotificationCountResponse> {
  const { data } = await apiClient.patch<UnreadNotificationCountResponse>(
    "/notifications/read-all",
  );
  return data;
}
