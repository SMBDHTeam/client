export type NotificationType =
  | "POST_LIKE"
  | "COMMENT"
  | "COMMENT_REPLY"
  | "COMMENT_LIKE"
  | "FOLLOW";

export type NotificationTargetType = "POST" | "COMMENT" | "USER";

export type NotificationActor = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type NotificationItem = {
  id: number;
  type: NotificationType;
  actor: NotificationActor | null;
  targetType: NotificationTargetType;
  targetId: number;
  read: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  nextCursor: number | null;
  unreadCount: number;
};

export type UnreadNotificationCountResponse = {
  unreadCount: number;
};
