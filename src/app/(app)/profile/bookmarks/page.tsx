"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, Bookmark } from "lucide-react";
import { getMyBookmarks, getPost } from "@/lib/api/posts";
import { ApiError } from "@/lib/api/axios";
import type { FeedPost, PostDetail } from "@/types/api/post";
import PostModal from "@/components/community/PostModal";

export default function BookmarksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id != null ? String(session.user.id) : undefined;

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [detail, setDetail] = useState<PostDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getMyBookmarks({}, userId)
      .then((res) => setPosts(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  function openPost(post: FeedPost) {
    setSelectedPost(post);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    getPost(post.id, userId)
      .then((res) => setDetail(res))
      .catch((err) => setDetailError(err instanceof ApiError ? err.payload.message : "게시물을 불러오지 못했습니다."))
      .finally(() => setDetailLoading(false));
  }

  function closePost() {
    setSelectedPost(null);
    setDetail(null);
    setDetailError(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">북마크</h1>
        <div className="size-8" />
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-zinc-400">
            <Bookmark size={36} strokeWidth={1.5} />
            <p className="text-sm">저장한 게시물이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => openPost(post)}
                className="relative aspect-square bg-zinc-100"
              >
                {post.thumbnailUrl && (
                  <img src={post.thumbnailUrl} alt={post.placeName ?? post.content} className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <PostModal
            post={selectedPost}
            detail={detail}
            detailLoading={detailLoading}
            detailError={detailError}
            onClose={closePost}
            userId={userId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
