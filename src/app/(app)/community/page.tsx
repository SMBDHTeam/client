"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import PageFade from "@/components/ui/PageFade";
import { COMMUNITY_TAGS, type CommunityTagId } from "@/mocks/community-tags";
import { getFeed, getPopularFeed } from "@/lib/api/posts";
import { ApiError } from "@/lib/api/axios";
import type { FeedPost } from "@/types/api/post";


const ASPECT_RATIOS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-square", "aspect-[4/5]"];

function ProfileBadge({ post, size = "size-8" }: { post: FeedPost; size?: string }) {
  return (
    <span className={`${size} relative grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-linear-to-br from-[#65a7f6] to-[#18b8ae] text-[10px] font-bold text-white shadow-md`}>
      {post.author.profileImageUrl ? (
        <Image
          src={post.author.profileImageUrl}
          alt={post.author.nickname}
          fill
          unoptimized
          referrerPolicy="no-referrer"
          className="object-cover"
        />
      ) : (
        post.author.nickname.slice(0, 1)
      )}
    </span>
  );
}

function GridTile({ post, onClick, index }: { post: FeedPost; onClick: () => void; index: number }) {
  const aspectClass = ASPECT_RATIOS[index % ASPECT_RATIOS.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative mb-2.5 w-full overflow-hidden rounded-[1.35rem] border border-white/90 bg-[#dfeef7] shadow-[0_8px_22px_rgba(51,112,163,0.13)] ring-1 ring-[#b9dcf2] ${aspectClass}`}
    >
      {post.thumbnailUrl && (
        <Image
          src={post.thumbnailUrl}
          alt={post.placeName ?? post.content}
          fill
          unoptimized
          sizes="(max-width: 512px) 50vw, 250px"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-[#173b63]/55 via-transparent to-transparent" />
      {post.mediaCount > 1 && (
        <div className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#344052]/55 backdrop-blur-sm">
          <span className="text-[11px] font-bold text-white">{post.mediaCount}</span>
        </div>
      )}
      <div className="absolute inset-x-1 bottom-1 rounded-[1.1rem] border border-white/35 bg-[#31516f]/45 px-3 py-2.5 text-left shadow-[0_4px_16px_rgba(14,43,72,0.14)] backdrop-blur-md">
        <p className="truncate text-sm font-bold text-white drop-shadow-sm">{post.placeName ?? post.content}</p>
        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-white/90">
          <span className="flex items-center gap-1"><Heart size={13} className="fill-white stroke-none" /> {post.likeCount}</span>
          <span className="flex items-center gap-1"><MessageCircle size={13} /> {post.commentCount}</span>
          <span>· {post.createdAgo}</span>
        </div>
      </div>
    </button>
  );
}

function SquareGridTile({ post, onClick }: { post: FeedPost; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-white/80 bg-[#dfeef7] shadow-sm"
    >
      {post.thumbnailUrl && (
        <Image
          src={post.thumbnailUrl}
          alt={post.placeName ?? post.content}
          fill
          unoptimized
          sizes="(max-width: 512px) 33vw, 170px"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      {post.mediaCount > 1 && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-black/40 px-1.5 py-0.5">
          <span className="text-[10px] font-semibold text-white">{post.mediaCount}</span>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 opacity-0 transition-opacity duration-200 group-hover:bg-black/30 group-hover:opacity-100">
        <span className="flex items-center gap-1 text-xs font-semibold text-white">
          <Heart size={13} className="fill-white stroke-none" /> {post.likeCount}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-white">
          <MessageCircle size={13} className="fill-white stroke-none" /> {post.commentCount}
        </span>
        <span className="text-xs font-semibold text-white">{post.createdAgo}</span>
      </div>
    </button>
  );
}


export default function CommunityPage() {
  const { status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [popularPosts, setPopularPosts] = useState<FeedPost[]>([]);

  const [activeTag, setActiveTag] = useState<CommunityTagId | null>(null);
  const [viewMode, setViewMode] = useState<"tile" | "grid">("tile");
  const tagScrollRef = useRef<HTMLDivElement>(null);
  const tagDragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  const loadFeedRequestRef = useRef(0);

  const loadFeed = useCallback(async (category?: string) => {
    const requestId = ++loadFeedRequestRef.current;
    setLoading(true);
    setFeedError(null);
    try {
      const res = await getFeed({ size: 20, ...(category ? { category } : {}) });
      if (loadFeedRequestRef.current !== requestId) return;
      setPosts(res.items);
      setNextCursor(res.nextCursor);
    } catch (err) {
      if (loadFeedRequestRef.current !== requestId) return;
      setFeedError(err instanceof ApiError ? err.payload.message : "피드를 불러오지 못했습니다.");
    } finally {
      if (loadFeedRequestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    queueMicrotask(() => {
      void loadFeed();
      void getPopularFeed({ size: 5 }).then((res) => setPopularPosts(res.items)).catch(() => {});
    });
  }, [status, loadFeed]);

  function openPost(post: FeedPost) {
    router.push(`/community/posts/${post.id}`);
  }

  async function loadMore() {
    if (nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getFeed({ cursor: nextCursor, size: 20, ...(activeTagLabel ? { category: activeTagLabel } : {}) });
      setPosts((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setFeedError(err instanceof ApiError ? err.payload.message : "피드를 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }

function onTagMouseDown(e: React.MouseEvent) {
    const el = tagScrollRef.current;
    if (!el) return;
    tagDragRef.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = "grabbing";
  }

  function onTagMouseMove(e: React.MouseEvent) {
    const el = tagScrollRef.current;
    if (!el || !tagDragRef.current.dragging) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = tagDragRef.current.scrollLeft - (x - tagDragRef.current.startX);
  }

  function onTagMouseUp() {
    tagDragRef.current.dragging = false;
    if (tagScrollRef.current) tagScrollRef.current.style.cursor = "grab";
  }

  const activeTagLabel = activeTag ? COMMUNITY_TAGS.find((t) => t.id === activeTag)?.label ?? null : null;

  const topPosts = popularPosts;
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const popularDragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  function scrollPopular(dir: "left" | "right") {
    popularScrollRef.current?.scrollBy({ left: dir === "right" ? 160 : -160, behavior: "smooth" });
  }

  function onPopularMouseDown(e: React.MouseEvent) {
    const el = popularScrollRef.current;
    if (!el) return;
    popularDragRef.current = { dragging: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = "grabbing";
  }

  function onPopularMouseMove(e: React.MouseEvent) {
    const el = popularScrollRef.current;
    if (!el || !popularDragRef.current.dragging) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = popularDragRef.current.scrollLeft - (x - popularDragRef.current.startX);
  }

  function onPopularMouseUp() {
    popularDragRef.current.dragging = false;
    if (popularScrollRef.current) popularScrollRef.current.style.cursor = "grab";
  }

  return (
    <PageFade className="flex min-h-0 flex-1 flex-col bg-white text-[#0b2146]">
      <header className="relative h-16 shrink-0 border-b border-[#edf1f5] bg-white">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="absolute left-4 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full text-[#0b3972] transition-colors hover:bg-white/45"
        >
          <ChevronLeft size={28} strokeWidth={2.6} />
        </button>
        <h1 className="absolute inset-x-16 top-1/2 z-10 -translate-y-1/2 text-center text-[1.55rem] font-extrabold tracking-[-0.045em] text-[#081d43] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
          커뮤니티
        </h1>
      </header>

      {/* 태그 필터 */}
      <div className="relative shrink-0 border-b border-[#edf1f5] bg-white pb-2">
        <div
          ref={tagScrollRef}
          className="flex cursor-grab select-none gap-2 overflow-x-auto px-4 py-2 scrollbar-none"
          onMouseDown={onTagMouseDown}
          onMouseMove={onTagMouseMove}
          onMouseUp={onTagMouseUp}
          onMouseLeave={onTagMouseUp}
        >
        <button
          type="button"
          onClick={() => { setActiveTag(null); void loadFeed(); }}
          className={`h-11 shrink-0 rounded-full border px-4 text-sm font-bold shadow-sm transition-all ${
            activeTag === null
              ? "border-transparent bg-linear-to-br from-[#2394eb] to-[#18b8ae] text-white shadow-[0_6px_16px_rgba(37,151,214,0.2)]"
              : "border-[#dce4eb] bg-[#f8fafc] text-[#526d88]"
          }`}
        >
          전체
        </button>
        {COMMUNITY_TAGS.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
                const next = activeTag === tag.id ? null : tag.id;
                setActiveTag(next);
                const label = next ? COMMUNITY_TAGS.find((t) => t.id === next)?.label : undefined;
                void loadFeed(label);
              }}
            className={`h-11 shrink-0 rounded-full border px-4 text-sm font-bold shadow-sm transition-all ${
              activeTag === tag.id
                ? "border-transparent bg-linear-to-br from-[#2394eb] to-[#18b8ae] text-white shadow-[0_6px_16px_rgba(37,151,214,0.2)]"
                : "border-[#dce4eb] bg-[#f8fafc] text-[#526d88]"
            }`}
          >
            {tag.emoji} {tag.label}
          </button>
        ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-white to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-4 scrollbar-none">
      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
          <p className="text-sm text-zinc-400">피드를 불러오는 중...</p>
        </div>
      ) : feedError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 px-6 text-center">
          <p className="text-sm text-red-500">{feedError}</p>
        </div>
      ) : (
        <>
      {topPosts.length > 0 && (
      <section className="mb-7 pt-5">
        <div className="flex items-center px-4 pb-3">
          <h2 className="flex-1 text-[1.35rem] font-extrabold tracking-[-0.04em] text-[#0a2b5e]">인기 후기 🔥</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollPopular("left")}
              aria-label="인기 후기 이전"
              className="grid size-10 place-items-center rounded-full border border-white/90 bg-white/55 text-[#164a83] shadow-sm backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={21} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => scrollPopular("right")}
              aria-label="인기 후기 다음"
              className="grid size-10 place-items-center rounded-full border border-white/90 bg-white/55 text-[#164a83] shadow-sm backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronRight size={21} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        <div
          ref={popularScrollRef}
          className="flex cursor-grab snap-x snap-mandatory select-none gap-3 overflow-x-auto px-4 pb-2 scrollbar-none"
          onMouseDown={onPopularMouseDown}
          onMouseMove={onPopularMouseMove}
          onMouseUp={onPopularMouseUp}
          onMouseLeave={onPopularMouseUp}
        >
          {topPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => openPost(post)}
              className="group relative h-[13rem] w-[9.5rem] shrink-0 snap-start overflow-hidden rounded-[1.35rem] border border-white/90 bg-[#dfeef7] shadow-[0_9px_24px_rgba(51,112,163,0.16)] ring-1 ring-[#b9dcf2]"
            >
              {post.thumbnailUrl && (
                <Image
                  src={post.thumbnailUrl}
                  alt={post.placeName ?? post.content}
                  fill
                  unoptimized
                  sizes="152px"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-[#173b63]/55 via-transparent to-transparent" />
              <div className="absolute inset-x-1 bottom-1 rounded-[1.05rem] border border-white/35 bg-[#31516f]/45 px-2.5 py-2 text-left backdrop-blur-md">
                <p className="truncate text-sm font-bold text-white">{post.placeName ?? post.content}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/90">
                  <Heart size={13} className="fill-[#ff7385] stroke-none" />
                  <span>{post.likeCount}</span>
                  <span>· {post.createdAgo}</span>
                </div>
              </div>
              <div className="absolute left-2 top-2">
                <ProfileBadge post={post} />
              </div>
            </button>
          ))}
        </div>
      </section>
      )}

      <section className="pb-3">
        <div className="flex items-center px-4 pb-3">
          <h2 className="flex-1 text-[1.35rem] font-extrabold tracking-[-0.04em] text-[#0a2b5e]">최신 피드</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("tile")}
              aria-label="타일형 보기"
              className={`grid size-10 place-items-center rounded-full border shadow-sm backdrop-blur-sm transition-all ${
                viewMode === "tile"
                  ? "border-[#66c9f4] bg-white/75 text-[#1598ec]"
                  : "border-white/85 bg-white/45 text-[#7898b5]"
              }`}
            >
              <LayoutGrid size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="그리드형 보기"
              className={`grid size-10 place-items-center rounded-full border shadow-sm backdrop-blur-sm transition-all ${
                viewMode === "grid"
                  ? "border-[#66c9f4] bg-white/75 text-[#1598ec]"
                  : "border-white/85 bg-white/45 text-[#7898b5]"
              }`}
            >
              <List size={21} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">해당 태그의 게시물이 없어요</p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {viewMode === "tile" ? (
              <motion.div
                key="tile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="flex gap-2.5 px-4 pb-6"
              >
                {[0, 1].map((col) => (
                  <div key={col} className="flex flex-1 flex-col">
                    {posts
                      .filter((_, i) => i % 2 === col)
                      .map((post, i) => (
                        <GridTile
                          key={post.id}
                          post={post}
                          index={col === 0 ? i * 2 : i * 2 + 1}
                          onClick={() => openPost(post)}
                        />
                      ))}
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className="grid grid-cols-3 gap-1.5 px-4 pb-6"
              >
                {posts.map((post) => (
                  <SquareGridTile key={post.id} post={post} onClick={() => openPost(post)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!activeTagLabel && nextCursor != null && (
          <div className="flex justify-center pb-8">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-full border border-white/90 bg-white/65 px-5 py-2.5 text-xs font-bold text-[#416789] shadow-sm backdrop-blur-sm hover:bg-white/85 disabled:opacity-50"
            >
              {loadingMore ? "불러오는 중..." : "더 보기"}
            </button>
          </div>
        )}
      </section>
        </>
      )}

      </div>
    </PageFade>
  );
}
