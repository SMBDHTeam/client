"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import nubiLogo from "@/assets/icons/header/nubi-logo.png";
import bellIcon from "@/assets/icons/notification-bell-inactive.png";
import { getUnreadNotificationCount } from "@/lib/api/notifications";

const NOTIFICATION_COUNT_REFRESH_EVENT = "notifications:count-refresh";

export default function HomeHeader({ profileImageUrl }: { profileImageUrl?: string | null }) {
  const { status } = useSession();
  const profileImage = profileImageUrl;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    if (status !== "authenticated") return;

    const refreshUnreadCount = () => {
      getUnreadNotificationCount()
        .then((response) => {
          if (!ignore) {
            setUnreadCount(response.unreadCount);
          }
        })
        .catch(() => {
          if (!ignore) {
            setUnreadCount(0);
          }
        });
    };

    refreshUnreadCount();
    window.addEventListener(NOTIFICATION_COUNT_REFRESH_EVENT, refreshUnreadCount);
    window.addEventListener("focus", refreshUnreadCount);

    return () => {
      ignore = true;
      window.removeEventListener(NOTIFICATION_COUNT_REFRESH_EVENT, refreshUnreadCount);
      window.removeEventListener("focus", refreshUnreadCount);
    };
  }, [status]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-[#FFFFFF]/90 px-5 py-4 backdrop-blur">
      <Image src={nubiLogo} alt="누비" className="h-9 w-auto" priority />

      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          aria-label="알림"
          className="relative grid size-9 place-items-center rounded-full text-zinc-500 hover:bg-black/5"
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
          className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B]"
        >
          {profileImage && (
            <img src={profileImage} alt="프로필" className="size-full object-cover" referrerPolicy="no-referrer" />
          )}
        </Link>
      </div>
    </header>
  );
}
