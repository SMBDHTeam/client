"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  Ban,
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  HelpCircle,
  Info,
  LogOut,
  Luggage,
  MapPin,
  Pencil,
  User,
} from "lucide-react";

import { getSchedules } from "@/lib/api/schedules";
import { getUserProfile, type UserProfile } from "@/lib/api/users";
import { getMyWishlist, WISHLIST_MAX_PAGE_SIZE } from "@/lib/api/wishlists";

const APP_VERSION = "0.1.0";

function avatarLabel(name: string) {
  const normalized = name.replace(/[0-9\s_-]/g, "");
  if (!normalized) return "누비";
  if (/^[가-힣]+$/.test(normalized) && normalized.length >= 3) {
    return normalized.slice(1, 3);
  }
  return normalized.slice(0, 2).toUpperCase();
}

function countLabel(value: number | null, maximum?: number) {
  if (value == null) return "-";
  return maximum != null && value >= maximum ? `${maximum}+` : value.toLocaleString();
}

function SectionHeading({ title, signature }: { title: string; signature?: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-[1.15rem] font-extrabold tracking-[-0.04em] text-[#102750]">
        {title}
      </h2>
      <span className="h-px flex-1 bg-linear-to-r from-[#80b7f5] to-transparent" />
      {signature && (
        <span className="-ml-2 -rotate-6 font-[cursive] text-xl italic text-[#5b9de8]">
          Busan~
        </span>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const userId = user?.id != null ? Number(user.id) : null;
  const userIdStr = user?.id != null ? String(user.id) : undefined;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState<number | null>(null);
  const [tripCount, setTripCount] = useState<number | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!userId || !userIdStr) return;

    let cancelled = false;
    getUserProfile(userId)
      .then((response) => {
        if (!cancelled) setProfile(response);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, userId, userIdStr]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    void getMyWishlist()
      .then((response) => {
        if (!cancelled) setWishlistCount(response.items.length);
      })
      .catch(() => {});
    void getSchedules()
      .then((response) => {
        if (!cancelled) setTripCount(response.items.length);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName = profile?.nickname ?? user?.name ?? "게스트";
  const displayImage = profile?.profileImageUrl ?? user?.image ?? null;

  return (
    <div className="flex min-h-full shrink-0 flex-col bg-[#fbfdff]">
      <header className="relative h-36 shrink-0 overflow-hidden">
        <Image
          src="/trips-covers/header-busan.png"
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 512px"
          className="pointer-events-none object-cover object-[68%_66%] opacity-90"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/18 via-transparent to-[#fbfdff]" />
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="absolute top-3 left-3 z-10 grid size-11 place-items-center rounded-full text-[#102750] transition-colors hover:bg-white/65 active:bg-white/85"
        >
          <ChevronLeft size={31} strokeWidth={2.2} />
        </button>
        <h1 className="absolute top-5 left-1/2 z-10 -translate-x-1/2 text-xl font-extrabold tracking-[-0.045em] text-[#0b2146]">
          내 정보
        </h1>
      </header>

      <div className="relative z-10 -mt-3 flex flex-col gap-6 px-5 pb-8">
        <section className="flex items-center gap-4 rounded-[1.6rem] border border-[#e1ebf7] bg-white/94 p-4 shadow-[0_12px_32px_rgba(37,86,139,0.08)] backdrop-blur">
          <div className="relative grid size-[4.6rem] shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-[#79b9f8] to-[#4f8fea] text-xl font-extrabold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={`${displayName} 프로필`}
                fill
                unoptimized
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            ) : profileLoading ? (
              <span className="size-8 animate-pulse rounded-full bg-white/30" />
            ) : (
              avatarLabel(displayName)
            )}
          </div>

          <div className="min-w-0 flex-1">
            {profileLoading ? (
              <>
                <div className="mb-2 h-5 w-28 animate-pulse rounded-full bg-[#e8eef6]" />
                <div className="h-4 w-40 animate-pulse rounded-full bg-[#f0f3f7]" />
              </>
            ) : (
              <>
                <p className="truncate text-lg font-extrabold tracking-[-0.03em] text-[#0b2146]">
                  {displayName}
                </p>
                <p className="mt-1 truncate text-sm text-[#65758e]">{user?.email ?? ""}</p>
              </>
            )}
          </div>

          <Link
            href="/profile/edit"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#6fa8f6] px-3.5 py-2 text-sm font-bold text-[#2E7DF2] transition-colors hover:bg-[#edf5ff]"
          >
            <Pencil size={16} strokeWidth={2.2} />
            수정
          </Link>
        </section>

        <section className="grid grid-cols-2 overflow-hidden rounded-[1.35rem] border border-[#dce8f5] bg-white shadow-[0_8px_24px_rgba(37,86,139,0.05)]">
          <Link href="/trips" className="relative flex flex-col items-center py-4.5 text-[#102750]">
            <Luggage size={27} strokeWidth={2} className="text-[#2E7DF2]" />
            <span className="mt-1.5 text-sm font-semibold">여행</span>
            <strong className="mt-0.5 text-2xl leading-none">{countLabel(tripCount)}</strong>
            <span className="absolute top-5 right-0 bottom-5 w-px bg-[#dce8f5]" />
          </Link>
          <Link href="/wishlist" className="flex flex-col items-center py-4.5 text-[#102750]">
            <Heart size={28} strokeWidth={2.1} className="text-[#2E7DF2]" />
            <span className="mt-1.5 text-sm font-semibold">찜한 장소</span>
            <strong className="mt-0.5 text-2xl leading-none">
              {countLabel(wishlistCount, WISHLIST_MAX_PAGE_SIZE)}
            </strong>
          </Link>
        </section>

        <section>
          <SectionHeading title="나의 여행" signature />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Link
              href="/trips"
              className="flex min-h-20 items-center gap-3 rounded-[1.15rem] border border-[#dfe8f3] bg-white px-4 shadow-[0_5px_16px_rgba(37,86,139,0.035)] transition-transform hover:-translate-y-0.5"
            >
              <MapPin size={28} strokeWidth={2} className="shrink-0 text-[#2E7DF2]" />
              <span className="flex-1 text-sm font-bold text-[#1c3150]">내 여행</span>
              <ChevronRight size={19} className="text-[#91a0b4]" />
            </Link>
            <Link
              href="/wishlist"
              className="flex min-h-20 items-center gap-3 rounded-[1.15rem] border border-[#dfe8f3] bg-white px-4 shadow-[0_5px_16px_rgba(37,86,139,0.035)] transition-transform hover:-translate-y-0.5"
            >
              <Heart size={28} strokeWidth={2} className="shrink-0 text-[#2E7DF2]" />
              <span className="flex-1 text-sm font-bold text-[#1c3150]">찜한 장소</span>
              <ChevronRight size={19} className="text-[#91a0b4]" />
            </Link>
            <Link
              href="/profile/bookmarks"
              className="flex min-h-20 items-center gap-3 rounded-[1.15rem] border border-[#dfe8f3] bg-white px-4 shadow-[0_5px_16px_rgba(37,86,139,0.035)] transition-transform hover:-translate-y-0.5"
            >
              <Bookmark size={27} strokeWidth={2} className="shrink-0 text-[#2E7DF2]" />
              <span className="flex-1 text-sm font-bold text-[#1c3150]">북마크</span>
              <ChevronRight size={19} className="text-[#91a0b4]" />
            </Link>
            {user?.id ? (
              <Link
                href={`/community/users/${user.id}`}
                className="flex min-h-20 items-center gap-3 rounded-[1.15rem] border border-[#dfe8f3] bg-white px-4 shadow-[0_5px_16px_rgba(37,86,139,0.035)] transition-transform hover:-translate-y-0.5"
              >
                <User size={28} strokeWidth={2} className="shrink-0 text-[#2E7DF2]" />
                <span className="flex-1 text-sm font-bold text-[#1c3150]">내 프로필</span>
                <ChevronRight size={19} className="text-[#91a0b4]" />
              </Link>
            ) : (
              <div className="flex min-h-20 items-center gap-3 rounded-[1.15rem] border border-[#dfe8f3] bg-white px-4 opacity-60">
                <User size={28} strokeWidth={2} className="shrink-0 text-[#2E7DF2]" />
                <span className="flex-1 text-sm font-bold text-[#1c3150]">내 프로필</span>
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="계정 및 설정" />
          <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-[#dce7f3] bg-white shadow-[0_8px_24px_rgba(37,86,139,0.04)]">
            <Link
              href="/profile/blocked"
              className="flex min-h-15 items-center gap-3 border-b border-[#e8eef5] px-4"
            >
              <Ban size={22} strokeWidth={1.9} className="shrink-0 text-[#3a4c69]" />
              <span className="flex-1 text-sm font-semibold text-[#293d5d]">차단한 사용자</span>
              <ChevronRight size={19} className="text-[#91a0b4]" />
            </Link>
            <div aria-disabled="true" className="flex min-h-15 items-center gap-3 border-b border-[#e8eef5] px-4">
              <Bell size={22} strokeWidth={1.9} className="shrink-0 text-[#3a4c69]" />
              <span className="flex-1 text-sm font-semibold text-[#293d5d]">알림 설정</span>
              <span className="rounded-full bg-[#f1f3f6] px-2.5 py-1 text-[0.68rem] font-semibold text-[#98a3b2]">준비중</span>
              <ChevronRight size={19} className="text-[#91a0b4]" />
            </div>
            <div aria-disabled="true" className="flex min-h-15 items-center gap-3 border-b border-[#e8eef5] px-4">
              <HelpCircle size={22} strokeWidth={1.9} className="shrink-0 text-[#3a4c69]" />
              <span className="flex-1 text-sm font-semibold text-[#293d5d]">문의하기</span>
              <span className="rounded-full bg-[#f1f3f6] px-2.5 py-1 text-[0.68rem] font-semibold text-[#98a3b2]">준비중</span>
              <ChevronRight size={19} className="text-[#91a0b4]" />
            </div>
            <div className="flex min-h-15 items-center gap-3 px-4">
              <Info size={22} strokeWidth={1.9} className="shrink-0 text-[#3a4c69]" />
              <span className="flex-1 text-sm font-semibold text-[#293d5d]">앱 버전</span>
              <span className="text-sm text-[#8996aa]">v{APP_VERSION}</span>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#7eb0f3] bg-white py-3.5 text-sm font-bold text-[#2E7DF2] transition-colors hover:bg-[#edf5ff]"
        >
          <LogOut size={18} strokeWidth={2} aria-hidden />
          로그아웃
        </button>
      </div>
    </div>
  );
}
