"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, MapPin, X, Send, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { bookmarkPost, createComment, deleteComment, getComments, likeComment, unlikeComment, likePost, unbookmarkPost, unlikePost } from "@/lib/api/posts";
import { followUser, unfollowUser } from "@/lib/api/users";
import type { FeedPost, PostComment, PostDetail } from "@/types/api/post";

function CommentItem({
  comment,
  postId,
  userId,
  onReply,
  onDelete,
  isReply,
}: {
  comment: PostComment;
  postId: number;
  userId: string | undefined;
  onReply: (commentId: number, nickname: string) => void;
  onDelete: (commentId: number) => void;
  isReply?: boolean;
}) {
  const [likeState, setLikeState] = useState<{ likeCount: number; liked: boolean } | null>(null);
  const liked = likeState?.liked ?? comment.liked;
  const likeCount = likeState?.likeCount ?? comment.likeCount;
  const isMine = userId != null && String(comment.author.id) === userId;

  async function toggleLike() {
    if (!userId) return;
    try {
      const result = liked
        ? await unlikeComment(postId, comment.id)
        : await likeComment(postId, comment.id);
      setLikeState(result);
    } catch {
      //
    }
  }

  if (comment.deleted) {
    return (
      <div className={`flex gap-2 text-sm ${isReply ? "pl-9" : ""}`}>
        <div className="size-7 shrink-0 rounded-full bg-zinc-100" />
        <p className="flex-1 self-center text-xs text-zinc-400">삭제된 댓글이에요</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 text-sm ${isReply ? "pl-9" : ""}`}>
      {comment.author.profileImageUrl ? (
        <img src={comment.author.profileImageUrl} alt={comment.author.nickname} className="size-7 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="size-7 shrink-0 rounded-full bg-zinc-200" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-semibold">{comment.author.nickname}</span>
            <span className="ml-1.5 text-zinc-700">{comment.content}</span>
          </div>
          <button type="button" onClick={toggleLike} className="shrink-0 flex items-center gap-0.5 text-zinc-400 active:scale-90 transition-transform">
            <Heart size={13} className={liked ? "fill-red-500 stroke-red-500" : ""} />
            {likeCount > 0 && <span className="text-[11px]">{likeCount}</span>}
          </button>
        </div>
        <div className="mt-0.5 flex items-center gap-2.5">
          {!isReply && (
            <button type="button" onClick={() => onReply(comment.id, comment.author.nickname)} className="text-xs text-zinc-400">
              답글 달기
            </button>
          )}
          {isMine && (
            <button type="button" onClick={() => onDelete(comment.id)} className="text-xs text-zinc-400 hover:text-red-500">
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentSheet({
  postId,
  commentCount,
  userId,
  onClose,
}: {
  postId: number;
  commentCount: number;
  userId: string | undefined;
  onClose: () => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; nickname: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    getComments(postId, { size: 30 })
      .then((res) => setComments(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, userId]);

  function handleReply(commentId: number, nickname: string) {
    setReplyTo({ id: commentId, nickname });
    inputRef.current?.focus();
  }

  async function handleDeleteComment(commentId: number) {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await deleteComment(postId, commentId);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return { ...c, deleted: true };
          if (c.replies.some((r) => r.id === commentId)) {
            return { ...c, replies: c.replies.map((r) => (r.id === commentId ? { ...r, deleted: true } : r)) };
          }
          return c;
        }),
      );
    } catch {
      //
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim() || !userId || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(
        postId,
        { content: commentText.trim(), parentId: replyTo?.id },
      );
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...c.replies, newComment] } : c,
          ),
        );
      } else {
        setComments((prev) => [...prev, newComment]);
      }
      setCommentText("");
      setReplyTo(null);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch {
      //
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading && <div className="flex justify-center py-4"><div className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-[#2E7DF2]" /></div>}
        {!loading && comments.length === 0 && (
          <p className="text-xs text-zinc-400">첫 댓글을 남겨보세요</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="space-y-3">
            <CommentItem comment={c} postId={postId} userId={userId} onReply={handleReply} onDelete={handleDeleteComment} />
            {c.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} postId={postId} userId={userId} onReply={handleReply} onDelete={handleDeleteComment} isReply />
            ))}
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>
      <div className="border-t">
        {replyTo && (
          <div className="flex items-center justify-between bg-zinc-50 px-4 py-2">
            <span className="text-xs text-zinc-500">{replyTo.nickname}에게 답글</span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-zinc-400">
              <X size={13} />
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={replyTo ? `${replyTo.nickname}에게 답글...` : "댓글 달기..."}
            className="flex-1 text-sm outline-none placeholder:text-zinc-400"
            autoFocus
          />
          <button
            type="submit"
            disabled={!commentText.trim() || !userId || submitting}
            className="grid size-8 place-items-center rounded-full text-blue-500 transition-colors disabled:text-zinc-300"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function ModalContent({
  post,
  detail,
  detailLoading,
  detailError,
  onClose,
  userId,
}: {
  post: FeedPost;
  detail: PostDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  onClose: () => void;
  userId: string | undefined;
}) {
  const router = useRouter();
  const [imgIndex, setImgIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [likeState, setLikeState] = useState<{ likeCount: number; liked: boolean } | null>(null);
  const [bookmarked, setBookmarked] = useState<boolean | null>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const isMyPost = userId != null && String(post.author.id) === userId;
  const baseFollowing = following ?? false;

  async function toggleFollow() {
    if (!userId || isMyPost) return;
    setFollowLoading(true);
    try {
      const result = baseFollowing
        ? await unfollowUser(post.author.id)
        : await followUser(post.author.id);
      setFollowing(result.following);
    } catch {
      //
    } finally {
      setFollowLoading(false);
    }
  }

  const baseLiked = likeState?.liked ?? detail?.liked ?? post.liked;
  const baseLikeCount = likeState?.likeCount ?? detail?.likeCount ?? post.likeCount;
  const baseBookmarked = bookmarked ?? detail?.bookmarked ?? post.bookmarked;
  const commentCount = detail?.commentCount ?? post.commentCount;

  async function toggleLike() {
    if (!userId) return;
    try {
      const result = baseLiked
        ? await unlikePost(post.id)
        : await likePost(post.id);
      setLikeState(result);
    } catch {
      //
    }
  }

  async function toggleBookmark() {
    if (!userId) return;
    try {
      const result = baseBookmarked
        ? await unbookmarkPost(post.id)
        : await bookmarkPost(post.id);
      setBookmarked(result.bookmarked);
    } catch {
      //
    }
  }

  const images = detail ? detail.mediaList.map((m) => m.url) : post.thumbnailUrl ? [post.thumbnailUrl] : [];

  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white"
      style={{ maxHeight: "90dvh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <button type="button" onClick={() => { onClose(); router.push(`/community/users/${post.author.id}`); }} className="shrink-0">
          {post.author.profileImageUrl ? (
            <img src={post.author.profileImageUrl} alt={post.author.nickname} className="size-8 rounded-full object-cover" />
          ) : (
            <div className="size-8 rounded-full bg-zinc-200" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button type="button" onClick={() => { onClose(); router.push(`/community/users/${post.author.id}`); }} className="text-left">
            <p className="text-sm font-semibold leading-tight">{post.author.nickname}</p>
            {post.placeName && (
              <p className="flex items-center gap-1 text-xs text-zinc-400"><MapPin size={10} />{post.placeName}</p>
            )}
          </button>
        </div>
        {!isMyPost && (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={followLoading}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              baseFollowing ? "border border-zinc-200 text-zinc-600" : "bg-[#2E7DF2] text-white"
            }`}
          >
            {followLoading ? "..." : baseFollowing ? "팔로잉" : "팔로우"}
          </button>
        )}
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
          <Heart size={24} className={baseLiked ? "fill-red-500 stroke-red-500" : "stroke-zinc-700"} />
        </button>
        <button type="button" onClick={() => setShowComments(true)} className="text-zinc-700">
          <MessageCircle size={24} />
        </button>
        <span className="ml-1 flex-1 text-sm font-semibold">{baseLikeCount}명이 좋아해요</span>
        <button type="button" onClick={toggleBookmark} className="transition-transform active:scale-90">
          <Bookmark size={24} className={baseBookmarked ? "fill-zinc-800 stroke-zinc-800" : "stroke-zinc-700"} />
        </button>
      </div>

      <div className="px-4 pb-2">
        <span className="text-sm font-semibold">{post.author.nickname}</span>
        <span className="text-sm text-zinc-700"> {detail?.content ?? post.content}</span>
      </div>

      <div className="px-4 pb-4">
        <button type="button" onClick={() => setShowComments(true)} className="text-xs text-zinc-400">
          댓글 {commentCount}개 보기
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <CommentSheet
            postId={post.id}
            commentCount={commentCount}
            userId={userId}
            onClose={() => setShowComments(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PostModal({
  post,
  detail,
  detailLoading,
  detailError,
  onClose,
  userId,
}: {
  post: FeedPost;
  detail: PostDetail | null;
  detailLoading: boolean;
  detailError: string | null;
  onClose: () => void;
  userId: string | undefined;
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
        userId={userId}
      />
    </motion.div>
  );
}
