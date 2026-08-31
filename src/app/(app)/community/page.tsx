"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, MapPin, X, Send, ChevronLeft, ChevronRight, Grid3x3, LayoutGrid } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import PageFade from "@/components/ui/PageFade";
import { COMMUNITY_TAGS, type CommunityTagId } from "@/mocks/community-tags";
import { getFeed, getPost } from "@/lib/api/posts";
import { ApiError } from "@/lib/api/client";
import type { FeedPost, PostDetail } from "@/types/api/post";

type LocalComment = {
  id: number;
  author: string;
  text: string;
};

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

function CommentSheet({
  commentCount,
  comments,
  onClose,
  onAddComment,
}: {
  commentCount: number;
  comments: LocalComment[];
  onClose: () => void;
  onAddComment: (text: string) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim());
    setCommentText("");
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-2xl bg-white"
      style={{ height: "55dvh" }}
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      exit={{ clipPath: "inset(100% 0 0 0)" }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="flex items-center border-b px-4 py-3">
        <h3 className="flex-1 text-sm font-bold">댓글 {commentCount}개</h3>
        <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {comments.length === 0 && (
          <p className="text-xs text-zinc-400">첫 댓글을 남겨보세요</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2 text-sm">
            <span className="font-semibold shrink-0">{c.author}</span>
            <span className="text-zinc-700">{c.text}</span>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t px-4 py-3">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="댓글 달기..."
          className="flex-1 text-sm outline-none placeholder:text-zinc-400"
          autoFocus
        />
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="grid size-8 place-items-center rounded-full text-blue-500 transition-colors disabled:text-zinc-300"
        >
          <Send size={16} />
        </button>
      </form>
    </motion.div>
  );
}

function ModalContent({
  post,
  detail,
  detailLoading,
  detailError,
  onClose,
}: {
  post: FeedPost;
  detail: PostDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  onClose: () => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [comments, setComments] = useState<LocalComment[]>([]);

  const baseLiked = detail?.liked ?? post.liked;
  const baseLikeCount = detail?.likeCount ?? post.likeCount;
  const baseCommentCount = detail?.commentCount ?? post.commentCount;

  const liked = likedOverride ?? baseLiked;
  const likeCount = baseLikeCount + (liked === baseLiked ? 0 : liked ? 1 : -1);
  const commentCount = baseCommentCount + comments.length;

  function toggleLike() {
    setLikedOverride(!liked);
  }

  function addComment(text: string) {
    setComments((prev) => [...prev, { id: Date.now(), author: "나", text }]);
  }

  const images = detail ? detail.mediaList.map((m) => m.url) : post.thumbnailUrl ? [post.thumbnailUrl] : [];

  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white"
      style={{ maxHeight: "90dvh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        {post.author.profileImageUrl && (
          <img src={post.author.profileImageUrl} alt={post.author.nickname} className="size-8 rounded-full object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{post.author.nickname}</p>
          {post.placeName && (
            <p className="flex items-center gap-1 text-xs text-zinc-400"><MapPin size={10} />{post.placeName}</p>
          )}
        </div>
        <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100"><X size={16} /></button>
      </div>

      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {detailLoading && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
          </div>
        )}
        {detailError && !detailLoading && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs text-red-500">
            {detailError}
          </div>
        )}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${imgIndex * 100}%)` }}
        >
          {images.map((src, i) => (
            <img key={i} src={src} alt={`${post.placeName ?? "게시물"} ${i + 1}`} className="h-full w-full shrink-0 object-cover" />
          ))}
        </div>
        {images.length > 1 && (
          <>
            {imgIndex > 0 && (
              <button type="button" onClick={() => setImgIndex((i) => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/90 text-zinc-800 shadow">
                <ChevronLeft size={16} />
              </button>
            )}
            {imgIndex < images.length - 1 && (
              <button type="button" onClick={() => setImgIndex((i) => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/90 text-zinc-800 shadow">
                <ChevronRight size={16} />
              </button>
            )}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {images.map((_, i) => (
                <button key={i} type="button" onClick={() => setImgIndex(i)} className={`size-1.5 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <button type="button" onClick={toggleLike} className="transition-transform active:scale-90">
          <Heart size={24} className={liked ? "fill-red-500 stroke-red-500" : "stroke-zinc-700"} />
        </button>
        <button type="button" onClick={() => setShowComments(true)} className="text-zinc-700">
          <MessageCircle size={24} />
        </button>
        <span className="ml-1 text-sm font-semibold">{likeCount}명이 좋아해요</span>
      </div>

      <div className="px-4 pb-2">
        <span className="text-sm font-semibold">{post.author.nickname}</span>
        <span className="text-sm text-zinc-700"> {detail?.content ?? post.content}</span>
      </div>

      <div className="px-4 pb-4 space-y-1 overflow-hidden" style={{ height: "52px" }}>
        {comments.slice(0, 2).map((c) => (
          <div key={c.id} className="flex gap-2 text-sm">
            <span className="font-semibold shrink-0">{c.author}</span>
            <span className="text-zinc-700 truncate">{c.text}</span>
          </div>
        ))}
        {comments.length === 0 && (
          <button type="button" onClick={() => setShowComments(true)} className="text-xs text-zinc-400">
            댓글 {commentCount}개 보기
          </button>
        )}
      </div>

      <AnimatePresence>
        {showComments && (
          <CommentSheet
            commentCount={commentCount}
            comments={comments}
            onClose={() => setShowComments(false)}
            onAddComment={addComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PostModal({
  post,
  detail,
  detailLoading,
  detailError,
  onClose,
}: {
  post: FeedPost;
  detail: PostDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 sm:px-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <ModalContent
        post={post}
        detail={detail}
        detailLoading={detailLoading}
        detailError={detailError}
        onClose={onClose}
      />
    </motion.div>
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
    });
  }, [status, loadFeed]);

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

  const topPosts = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 5);
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
          />
        )}
      </AnimatePresence>
      </div>
    </PageFade>
  );
}
