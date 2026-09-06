"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import HomeHeader from "@/components/layout/HomeHeader";
import PageFade from "@/components/ui/PageFade";
import { POPULAR_DESTINATIONS } from "@/mocks/home";
import { getPopularFeed } from "@/lib/api/posts";
import type { FeedPost } from "@/types/api/post";
import searchIcon from "@/assets/icons/search.png";

export default function HomePage() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name;

  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    getPopularFeed({ size: 2 })
      .then((res) => setCommunityPosts(res.items))
      .catch(() => {});
  }, [status]);

  return (
    <PageFade className="flex flex-1 flex-col bg-[#F6F8FC] text-zinc-900">
      <HomeHeader />

      <div className="space-y-6 px-5 pt-2 pb-8">
        <h1 className="text-[22px] font-bold leading-relaxed pt-2">
          어서오세요{userName ? ` ${userName}님` : ""},
          <br />
          오늘은 어디로 떠날까요?
        </h1>

        <Link
          href="/trips"
          className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5"
        >
          <Image src={searchIcon} alt="" width={20} height={20} />
          <span className="text-sm text-zinc-400">도시, 지역을 검색해보세요</span>
        </Link>

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
          <div className="grid grid-cols-2 gap-4">
            {POPULAR_DESTINATIONS.map((place, i) => (
              <Link
                key={i}
                href={place.href}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              >
                <div className={`aspect-16/10 bg-linear-to-br ${place.gradient}`} />
                <div className="px-3 py-3">
                  <p className="text-sm font-semibold">{place.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{place.desc}</p>
                </div>
              </Link>
            ))}
          </div>
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
                      {post.categories[0] ?? "여행후기"} · 댓글 {post.commentCount}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageFade>
  );
}
