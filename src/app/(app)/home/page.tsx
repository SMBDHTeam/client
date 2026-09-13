"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import HomeHeader from "@/components/layout/HomeHeader";
import PageFade from "@/components/ui/PageFade";
import PlaceDetailSheet from "@/components/sheet/PlaceDetailSheet";
import { getPopularFeed } from "@/lib/api/posts";
import { getPopularPlaces } from "@/lib/api/places";
import { getUserProfile } from "@/lib/api/users";
import type { FeedPost } from "@/types/api/post";
import type { PlaceSummary } from "@/types/api/place";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [userName, setUserName] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<PlaceSummary[]>([]);
  const [detailPlaceId, setDetailPlaceId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    getPopularFeed({ size: 2 })
      .then((res) => setCommunityPosts(res.items))
      .catch(() => {});
    getPopularPlaces({ size: 10 })
      .then((res) => setPopularPlaces(res.items))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return;
    getUserProfile(userId)
      .then((profile) => {
        setUserName(profile.nickname);
        setProfileImageUrl(profile.profileImageUrl);
      })
      .catch(() => setUserName(session?.user?.name ?? null));
  }, [session]);

  return (
    <PageFade className="flex flex-1 flex-col bg-[#F6F8FC] text-zinc-900">
      <HomeHeader profileImageUrl={profileImageUrl} />

      <div className="space-y-6 px-5 pt-2 pb-8">
        <h1 className="text-[22px] font-bold leading-relaxed pt-2">
          어서오세요{userName ? ` ${userName}님` : ""},
          <br />
          오늘은 어디로 떠날까요?
        </h1>

<div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] p-6 text-white">
          <div className="absolute -top-8 -right-6 size-32 rounded-full bg-white/10" />
          <div className="absolute top-10 right-10 size-16 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-lg font-bold">AI 맞춤 일정 만들기</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              취향만 알려주면 3초 만에
              <br />
              완벽한 여행 코스를 짜드려요
            </p>
            <Link
              href="/trips/new/date"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition-transform active:scale-95"
            >
              시작하기 <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold">지금 인기 여행지</h2>
          {popularPlaces.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {popularPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => setDetailPlaceId(place.placeId)}
                className="overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5"
              >
                <div className="aspect-16/10 bg-zinc-100">
                  {place.primaryImageUrl && (
                    <img
                      src={place.primaryImageUrl}
                      alt={place.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="px-3 py-3">
                  <p className="truncate text-sm font-semibold">{place.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">
                    {place.categoryLabel ?? place.address ?? ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-400">인기 여행지 정보를 준비 중이에요</p>
          )}
        </section>

        {communityPosts.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">커뮤니티 인기글</h2>
            <div className="grid grid-cols-2 gap-4">
              {communityPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/posts/${post.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                >
                  <div className="aspect-16/10 bg-zinc-100">
                    {post.thumbnailUrl && (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.placeName ?? post.content}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <p className="truncate text-sm font-semibold">{post.placeName ?? post.content}</p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {post.categories[0] ?? "여행후기"} · 댓글 {post.commentCount} · {post.createdAgo}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {detailPlaceId != null && (
        <PlaceDetailSheet placeId={detailPlaceId} onClose={() => setDetailPlaceId(null)} />
      )}
    </PageFade>
  );
}
