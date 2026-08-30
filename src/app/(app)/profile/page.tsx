"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Bell, ChevronRight, Heart, HelpCircle, Info, LogOut, MapPin } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { ALL_TRIPS, PAST_TRIPS } from "@/mocks/trips";
import { WISHLIST_PLACES } from "@/mocks/wishlist";

const APP_VERSION = "0.1.0";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const tripCount = ALL_TRIPS.length + PAST_TRIPS.length;
  const wishlistCount = WISHLIST_PLACES.length;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="내정보" />

      <div className="flex flex-1 flex-col gap-6 px-5 pt-2 pb-8">
        <div className="flex items-center gap-4 rounded-3xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] p-5 text-white">
          <div className="size-16 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/60">
            {user?.image && (
              <img
                src={user.image}
                alt=""
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{user?.name ?? "게스트"}</p>
            <p className="truncate text-sm text-white/80">{user?.email ?? ""}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/trips"
            className="flex flex-col items-center gap-1 rounded-2xl bg-white py-4 ring-1 ring-black/5"
          >
            <span className="text-lg font-bold text-zinc-900">{tripCount}</span>
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
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <Heart size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">찜한 장소</span>
            <ChevronRight size={16} className="text-zinc-300" aria-hidden />
          </Link>
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
