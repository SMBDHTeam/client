"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Bell, Bookmark, ChevronRight, Heart, HelpCircle, Info, LogOut, MapPin, Pencil, User } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { WISHLIST_PLACES } from "@/mocks/wishlist";
import { getUserProfile, type UserProfile } from "@/lib/api/users";

const APP_VERSION = "0.1.0";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id != null ? Number(user.id) : null;
  const userIdStr = user?.id != null ? String(user.id) : undefined;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!userId || !userIdStr) return;
    getUserProfile(userId)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [userId, userIdStr]);

  const displayName = profile?.nickname ?? user?.name ?? "게스트";
  const displayImage = profile ? profile.profileImageUrl : null;

  const wishlistCount = WISHLIST_PLACES.length;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="내정보" />

      <div className="flex flex-1 flex-col gap-6 px-5 pt-2 pb-8">
        <div className="flex items-center gap-4 rounded-3xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] p-5 text-white">
          <div className="size-16 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/60">
            {!profileLoading && displayImage && (
              <img
                src={displayImage}
                alt=""
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {profileLoading ? (
              <>
                <div className="mb-2 h-5 w-24 animate-pulse rounded-full bg-white/30" />
                <div className="h-3.5 w-40 animate-pulse rounded-full bg-white/20" />
              </>
            ) : (
              <>
                <p className="truncate text-lg font-bold">{displayName}</p>
                <p className="truncate text-sm text-white/80">{user?.email ?? ""}</p>
              </>
            )}
          </div>
          <Link href="/profile/edit" className="grid size-8 shrink-0 place-items-center rounded-full bg-white/20 hover:bg-white/30">
            <Pencil size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/trips"
            className="flex flex-col items-center gap-1 rounded-2xl bg-white py-4 ring-1 ring-black/5"
          >
            <span className="text-lg font-bold text-zinc-900">-</span>
            <span className="text-xs font-medium text-zinc-400">여행</span>
          </Link>
          <Link
            href="/wishlist"
            className="flex flex-col items-center gap-1 rounded-2xl bg-white py-4 ring-1 ring-black/5"
          >
            <span className="text-lg font-bold text-zinc-900">{wishlistCount}</span>
            <span className="text-xs font-medium text-zinc-400">찜한 장소</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <Link
            href="/trips"
            className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <MapPin size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">내 여행</span>
            <ChevronRight size={16} className="text-zinc-300" aria-hidden />
          </Link>
          <Link
            href="/wishlist"
            className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <Heart size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">찜한 장소</span>
            <ChevronRight size={16} className="text-zinc-300" aria-hidden />
          </Link>
          <Link
            href="/profile/bookmarks"
            className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <Bookmark size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">북마크</span>
            <ChevronRight size={16} className="text-zinc-300" aria-hidden />
          </Link>
          {user?.id && (
            <Link
              href={`/community/users/${user.id}`}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
                <User size={16} aria-hidden />
              </span>
              <span className="flex-1 text-sm font-medium text-zinc-700">내 프로필</span>
              <ChevronRight size={16} className="text-zinc-300" aria-hidden />
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5 opacity-50">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <Bell size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">알림 설정</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-400">준비중</span>
          </div>
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5 opacity-50">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <HelpCircle size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">문의하기</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-400">준비중</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <Info size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">앱 버전</span>
            <span className="text-sm text-zinc-400">v{APP_VERSION}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-auto flex items-center justify-center gap-2 rounded-full border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-500"
        >
          <LogOut size={16} aria-hidden />
          로그아웃
        </button>
      </div>
    </div>
  );
}
