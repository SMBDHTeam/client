"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { getNotifications, markNotificationAsRead } from "@/lib/api/notifications";
import { ApiError } from "@/lib/api/axios";
import type { NotificationItem } from "@/types/api/notification";

const GROUP_LABELS = ["오늘", "어제", "최근 7일", "이전"] as const;

type NotificationGroupLabel = (typeof GROUP_LABELS)[number];

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
  if (notification.linkUrl) {
    return notification.linkUrl;
  }

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

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function notificationGroupLabel(value: string): NotificationGroupLabel {
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) {
    return "이전";
  }

  const today = startOfDay(new Date());
  const createdDay = startOfDay(createdAt);
  const diffDays = Math.floor((today.getTime() - createdDay.getTime()) / 86400000);

  if (diffDays <= 0) {
    return "오늘";
  }

  if (diffDays === 1) {
    return "어제";
  }

  if (diffDays <= 7) {
    return "최근 7일";
  }

  return "이전";
}

function groupNotifications(notifications: NotificationItem[]) {
  const groups = new Map<NotificationGroupLabel, NotificationItem[]>();

  for (const label of GROUP_LABELS) {
    groups.set(label, []);
  }

  for (const notification of notifications) {
    groups.get(notificationGroupLabel(notification.createdAt))?.push(notification);
  }

  return GROUP_LABELS.map((label) => ({
    label,
    items: groups.get(label) ?? [],
  })).filter((group) => group.items.length > 0);
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const groupedNotifications = groupNotifications(notifications);

  const handleNotificationClick = async (notification: NotificationItem) => {
    const href = notificationHref(notification);

    if (!notification.read) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item,
        ),
      );

      try {
        await markNotificationAsRead(notification.id);
      } catch {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: false } : item,
          ),
        );
      }
    }

    if (href) {
      router.push(href);
    }
  };

  useEffect(() => {
    let cancelled = false;

    getNotifications({ size: 30 })
      .then((response) => {
        if (cancelled) return;
        setNotifications(response.items);
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
          <div className="flex flex-col gap-7">
            {groupedNotifications.map((group) => (
              <section key={group.label}>
                <h2 className="mb-3 px-1 text-base font-bold text-zinc-900">{group.label}</h2>
                <ul className="flex flex-col gap-1">
                  {group.items.map((notification) => {
                    const href = notificationHref(notification);
                    const content = (
                      <>
                        <span
                          className={`mt-2 size-2 shrink-0 rounded-full ${
                            notification.read ? "bg-transparent" : "bg-[#2E7DF2]"
                          }`}
                        />
                        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-100 text-zinc-400">
                          {notification.actor?.profileImageUrl ? (
                            <Image
                              src={notification.actor.profileImageUrl}
                              alt=""
                              width={44}
                              height={44}
                              className="size-full object-cover"
                              referrerPolicy="no-referrer"
                              unoptimized
                            />
                          ) : (
                            <Bell size={20} aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-5 text-zinc-900">
                            {notificationMessage(notification)}{" "}
                            <span className="font-normal text-zinc-400">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </span>
                        </span>
                        {href && <ChevronRight size={16} className="mt-3 shrink-0 text-zinc-300" aria-hidden />}
                      </>
                    );

                    return (
                      <li key={notification.id}>
                        <button
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className="flex w-full gap-3 rounded-2xl px-1 py-3 text-left transition-colors hover:bg-white/70"
                        >
                          {content}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
