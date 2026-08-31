"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Grid3x3, LayoutGrid } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import PageFade from "@/components/ui/PageFade";
import { COMMUNITY_TAGS, type CommunityTagId } from "@/mocks/community-tags";
import { getFeed, getPopularFeed, getPost } from "@/lib/api/posts";
import { ApiError } from "@/lib/api/axios";
import type { FeedPost, PostDetail } from "@/types/api/post";
import PostModal from "@/components/community/PostModal";


const ASPECT_RATIOS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-square", "aspect-[4/5]"];

function GridTile({ post, onClick, index }: { post: FeedPost; onClick: () => void; index: number }) {
  const aspectClass = ASPECT_RATIOS[index % ASPECT_RATIOS.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative mb-2 w-full overflow-hidden rounded-2xl bg-zinc-100 ${aspectClass}`}
    >
      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          alt={post.placeName ?? post.content}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      {post.mediaCount > 1 && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/40 px-1.5 py-0.5">
          <span className="text-[10px] font-semibold text-white">{post.mediaCount}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="truncate text-xs font-semibold text-white drop-shadow">{post.placeName ?? post.content}</p>
        <div className="mt-0.5 flex gap-2 text-[11px] text-white/80">
          <span className="flex items-center gap-0.5"><Heart size={10} className="fill-white/80 stroke-none" /> {post.likeCount}</span>
          <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {post.commentCount}</span>
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
      className="group relative aspect-square w-full overflow-hidden bg-zinc-100"
    >
      {post.thumbnailUrl && (
        <img
          src={post.thumbnailUrl}
          alt={post.placeName ?? post.content}
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
      </div>
    </button>
  );
}


export default function CommunityPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id != null ? String(session.user.id) : undefined;

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [popularPosts, setPopularPosts] = useState<FeedPost[]>([]);

  const [selectedFeedPost, setSelectedFeedPost] = useState<FeedPost | null>(null);
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [activeTag, setActiveTag] = useState<CommunityTagId | null>(null);
  const [viewMode, setViewMode] = useState<"tile" | "grid">("tile");
  const tagScrollRef = useRef<HTMLDivElement>(null);
  const tagDragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  const loadFeedRequestRef = useRef(0);

  const loadFeed = useCallback(async () => {
    const requestId = ++loadFeedRequestRef.current;
    setLoading(true);
    setFeedError(null);
    try {
      const res = await getFeed({ size: 20 }, userId);
      if (loadFeedRequestRef.current !== requestId) return;
      setPosts(res.items);
      setNextCursor(res.nextCursor);
    } catch (err) {
      if (loadFeedRequestRef.current !== requestId) return;
      setFeedError(err instanceof ApiError ? err.payload.message : "피드를 불러오지 못했습니다.");
    } finally {
      if (loadFeedRequestRef.current === requestId) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (status === "loading") return;
    queueMicrotask(() => {
      void loadFeed();
      void getPopularFeed({ size: 5 }, userId).then((res) => setPopularPosts(res.items)).catch(() => {});
    });
  }, [status, loadFeed, userId]);

  async function loadMore() {
    if (nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getFeed({ cursor: nextCursor, size: 20 }, userId);
      setPosts((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setFeedError(err instanceof ApiError ? err.payload.message : "피드를 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  }

  function openPost(post: FeedPost) {
    setSelectedFeedPost(post);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    getPost(post.id, userId)
      .then((res) => setDetail(res))
      .catch((err) => setDetailError(err instanceof ApiError ? err.payload.message : "게시물을 불러오지 못했습니다."))
      .finally(() => setDetailLoading(false));
  }

  function closePost() {
    setSelectedFeedPost(null);
    setDetail(null);
    setDetailError(null);
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
  const filteredPosts = activeTagLabel ? posts.filter((p) => p.hashtags.includes(activeTagLabel)) : posts;

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
    <PageFade className="flex flex-1 flex-col">
      <AppHeader title="커뮤니티" />

      {/* 태그 필터 */}
      <div className="relative">
        <div
          ref={tagScrollRef}
          className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-none cursor-grab select-none"
          onMouseDown={onTagMouseDown}
          onMouseMove={onTagMouseMove}
          onMouseUp={onTagMouseUp}
          onMouseLeave={onTagMouseUp}
        >
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            activeTag === null ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
          }`}
        >
          전체
        </button>
        {COMMUNITY_TAGS.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              activeTag === tag.id
                ? "bg-[#2E7DF2] text-white"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {tag.emoji} {tag.label}
          </button>
        ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-white to-transparent" />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto scrollbar-none">
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
      <section className="mb-5">
        <div className="flex items-center px-4 pb-2 pt-1">
          <h2 className="flex-1 text-sm font-bold text-zinc-800">인기 후기 🔥</h2>
          <div className="flex gap-1">
            <button type="button" onClick={() => scrollPopular("left")} className="grid size-7 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
              <ChevronLeft size={15} />
            </button>
            <button type="button" onClick={() => scrollPopular("right")} className="grid size-7 place-items-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
        <div
          ref={popularScrollRef}
          className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none cursor-grab select-none"
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
              className="group relative h-48 w-36 shrink-0 overflow-hidden rounded-2xl bg-zinc-100"
            >
              {post.thumbnailUrl && (
                <img
                  src={post.thumbnailUrl}
                  alt={post.placeName ?? post.content}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="truncate text-[11px] font-semibold text-white">{post.placeName ?? post.content}</p>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/80">
                  <Heart size={9} className="fill-red-400 stroke-none" />
                  <span>{post.likeCount}</span>
                </div>
              </div>
              <div className="absolute left-2 top-2">
                {post.author.profileImageUrl && (
                  <img src={post.author.profileImageUrl} alt={post.author.nickname} className="size-6 rounded-full border border-white object-cover" />
                )}
              </div>
            </button>
          ))}
        </div>
      </section>
      )}

      <section>
        <div className="flex items-center px-4 pb-2">
          <h2 className="flex-1 text-sm font-bold text-zinc-800">최신 피드</h2>
          <div className="flex gap-1 rounded-full bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode("tile")}
              aria-label="타일형 보기"
              className={`grid size-6 place-items-center rounded-full transition-colors ${
                viewMode === "tile" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400"
              }`}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="그리드형 보기"
              className={`grid size-6 place-items-center rounded-full transition-colors ${
                viewMode === "grid" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400"
              }`}
            >
              <Grid3x3 size={13} />
            </button>
          </div>
        </div>
        {filteredPosts.length === 0 ? (
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
                className="flex gap-2 px-3 pb-6"
              >
                {[0, 1].map((col) => (
                  <div key={col} className="flex flex-1 flex-col">
                    {filteredPosts
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
                className="grid grid-cols-3 gap-0.5 pb-6"
              >
                {filteredPosts.map((post) => (
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
              className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 disabled:opacity-50"
            >
              {loadingMore ? "불러오는 중..." : "더 보기"}
            </button>
          </div>
        )}
      </section>
        </>
      )}

      <AnimatePresence>
        {selectedFeedPost && (
          <PostModal
            post={selectedFeedPost}
            detail={detail}
            detailLoading={detailLoading}
            detailError={detailError}
            onClose={closePost}
            userId={userId}
          />
        )}
      </AnimatePresence>
      </div>
    </PageFade>
  );
}
