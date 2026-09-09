"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { getNotifications, markNotificationAsRead } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/axios";
import type { NotificationItem } from "@/types/api/notification";

function actorName(notification: NotificationItem) {
  return notification.actor?.nickname ?? "누군가";
}

function notificationMessage(notification: NotificationItem) {
  const name = actorName(notification);

  switch (notification.type) {
    case "POST_LIKE":
      return `${name}님이 내 게시물을 좋아요 했습니다.`;
    case "COMMENT":
      return `${name}님이 내 게시물에 댓글을 남겼습니다.`;
    case "COMMENT_REPLY":
      return `${name}님이 내 댓글에 답글을 남겼습니다.`;
    case "COMMENT_LIKE":
      return `${name}님이 내 댓글을 좋아요 했습니다.`;
    case "FOLLOW":
      return `${name}님이 나를 팔로우했습니다.`;
    default:
      return "새 알림이 도착했습니다.";
  }
}

function notificationHref(notification: NotificationItem) {
  if (notification.targetType === "POST") {
    return `/community/posts/${notification.targetId}`;
  }

  if (notification.targetType === "USER") {
    return `/community/users/${notification.targetId}`;
  }

  return null;
}

function formatRelativeTime(value: string) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (Number.isNaN(createdAt.getTime())) {
    return "";
  }

  if (diffMinutes < 1) {
    return "방금 전";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  return createdAt.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNotificationClick = async (notification: NotificationItem) => {
    const href = notificationHref(notification);

    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));

      try {
        await markNotificationAsRead(notification.id);
      } catch {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: false } : item,
          ),
        );
        setUnreadCount((current) => current + 1);
      }
    }

    if (href) {
      router.push(href);
    }
  };

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getNotifications({ size: 30 })
      .then((response) => {
        if (cancelled) return;
        setNotifications(response.items);
        setUnreadCount(response.unreadCount);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.payload.message : "알림을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col bg-[#F6F8FC]">
      <AppHeader title="알림" />

      <main className="flex flex-1 flex-col px-5 pb-8 pt-2">
        <section className="mb-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-zinc-500">읽지 않은 알림</p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{unreadCount}</p>
        </section>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
            <p className="text-sm text-zinc-400">알림을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-white px-6 py-20 text-center ring-1 ring-black/5">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-white px-6 py-20 text-center ring-1 ring-black/5">
            <span className="grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-400">
              <Bell size={24} aria-hidden />
            </span>
            <p className="text-sm font-medium text-zinc-700">아직 알림이 없습니다.</p>
            <p className="text-xs text-zinc-400">좋아요, 댓글, 팔로우 알림이 여기에 표시됩니다.</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
            {notifications.map((notification) => {
              const href = notificationHref(notification);
              const content = (
                <>
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ${
                      notification.read ? "bg-zinc-200" : "bg-[#2E7DF2]"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-zinc-900">
                      {notificationMessage(notification)}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-400">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                  {href && <ChevronRight size={16} className="shrink-0 text-zinc-300" aria-hidden />}
                </>
              );

              return (
                <li key={notification.id} className="border-b border-zinc-100 last:border-b-0">
                  {href ? (
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className="flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-zinc-50"
                    >
                      {content}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className="flex w-full gap-3 px-4 py-4 text-left"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
