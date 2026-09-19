"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import nubiLogo from "@/assets/icons/header/nubi-logo.png";
import bellIcon from "@/assets/icons/notification-bell-inactive.png";
import { getUnreadNotificationCount } from "@/lib/api/notifications";
import { useNotificationStream } from "@/lib/notifications/use-notification-stream";

const NOTIFICATION_COUNT_REFRESH_EVENT = "notifications:count-refresh";
const NOTIFICATION_COUNT_POLLING_MS = 60_000;

export default function HomeHeader({
  profileImageUrl,
  profileLabel = "누비",
}: {
  profileImageUrl?: string | null;
  profileLabel?: string;
}) {
  const { status } = useSession();
  const profileImage = profileImageUrl;
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    getUnreadNotificationCount()
      .then((response) => {
        setUnreadCount(response.unreadCount);
      })
      .catch(() => {
        setUnreadCount(0);
      });
  }, []);

  useNotificationStream({
    enabled: status === "authenticated",
    onNotification: refreshUnreadCount,
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    refreshUnreadCount();
    window.addEventListener(NOTIFICATION_COUNT_REFRESH_EVENT, refreshUnreadCount);
    window.addEventListener("focus", refreshUnreadCount);
    const pollingId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshUnreadCount();
      }
    }, NOTIFICATION_COUNT_POLLING_MS);

    return () => {
      window.clearInterval(pollingId);
      window.removeEventListener(NOTIFICATION_COUNT_REFRESH_EVENT, refreshUnreadCount);
      window.removeEventListener("focus", refreshUnreadCount);
    };
  }, [refreshUnreadCount, status]);

  return (
    <header className="sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-white/70 bg-white/80 px-5 pt-4 pb-3 shadow-[0_5px_18px_rgba(47,82,121,0.06)] backdrop-blur-xl backdrop-saturate-150">
      <Image src={nubiLogo} alt="누비" className="h-9 w-auto" priority />

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          aria-label="알림"
          className="relative grid size-10 place-items-center rounded-full text-[#71839b] transition-colors hover:bg-white/55"
        >
          <Image src={bellIcon} alt="" width={30} height={30} />
          {status === "authenticated" && unreadCount > 0 && (
            <span className="absolute right-1 top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <Link
          href="/profile"
          aria-label="내 정보"
          className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-[#79A9F2] to-[#574BCB] text-xs font-bold text-white shadow-[0_5px_12px_rgba(61,85,169,0.16)] ring-1 ring-white/75"
        >
          {profileImage ? (
            <Image
              src={profileImage}
              alt="프로필"
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-cover"
            />
          ) : (
            <span>{profileLabel}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
