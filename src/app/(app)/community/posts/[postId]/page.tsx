"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, Bookmark, MapPin, ChevronLeft, ChevronRight, Send, X, Trash2, Pencil } from "lucide-react";
import { getPost, deletePost, updatePost, likePost, unlikePost, bookmarkPost, unbookmarkPost, getComments, createComment, deleteComment, likeComment, unlikeComment } from "@/lib/api/posts";
import { followUser, unfollowUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/axios";
import type { PostComment, PostDetail } from "@/types/api/post";
import { toast } from "sonner";

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
    } catch { /* */ }
  }

  if (comment.deleted) {
    return (
      <div className={`flex gap-3 ${isReply ? "pl-10" : ""}`}>
        <div className="size-8 shrink-0 rounded-full bg-zinc-100" />
        <p className="flex-1 self-center text-sm text-zinc-400">삭제된 댓글이에요</p>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isReply ? "pl-10" : ""}`}>
      {comment.author.profileImageUrl ? (
        <img src={comment.author.profileImageUrl} alt={comment.author.nickname} className="size-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="size-8 shrink-0 rounded-full bg-zinc-200" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-semibold">{comment.author.nickname}</span>
            <p className="mt-0.5 text-sm text-zinc-600 leading-snug">{comment.content}</p>
          </div>
          <button type="button" onClick={toggleLike} className="shrink-0 flex flex-col items-center gap-0.5 text-zinc-400 active:scale-90 transition-transform pt-0.5">
            <Heart size={14} className={liked ? "fill-red-500 stroke-red-500" : ""} />
            {likeCount > 0 && <span className="text-[10px]">{likeCount}</span>}
          </button>
        </div>
        <div className="mt-1 flex items-center gap-3">
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

export default function PostDetailPage() {
  const router = useRouter();
  const { postId } = useParams<{ postId: string }>();
  const { data: session } = useSession();
  const userId = session?.user?.id != null ? String(session.user.id) : undefined;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [likeState, setLikeState] = useState<{ likeCount: number; liked: boolean } | null>(null);
  const [bookmarked, setBookmarked] = useState<boolean | null>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: number; nickname: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = Number(postId);
    if (!id) return;
    getPost(id)
      .then((res) => {
        setPost(res);
        setLikeState({ likeCount: res.likeCount, liked: res.liked });
        setBookmarked(res.bookmarked);
      })
      .catch((err) => setError(err instanceof ApiError ? err.payload.message : "게시물을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [postId, userId]);

  function openComments() {
    setShowComments(true);
    if (comments.length === 0 && post) {
      setCommentsLoading(true);
      getComments(post.id, { size: 30 })
        .then((res) => setComments(res.items))
        .catch(() => {})
        .finally(() => setCommentsLoading(false));
    }
  }

  async function toggleLike() {
    if (!userId || !post) return;
    try {
      const result = likeState?.liked
        ? await unlikePost(post.id)
        : await likePost(post.id);
      setLikeState(result);
    } catch { /* */ }
  }

  async function toggleBookmark() {
    if (!userId || !post) return;
    try {
      const result = (bookmarked ?? post.bookmarked)
        ? await unbookmarkPost(post.id)
        : await bookmarkPost(post.id);
      setBookmarked(result.bookmarked);
    } catch { /* */ }
  }

  async function toggleFollow() {
    if (!userId || !post) return;
    setFollowLoading(true);
    try {
      const result = (following ?? false)
        ? await unfollowUser(post.author.id)
        : await followUser(post.author.id);
      setFollowing(result.following);
    } catch { /* */ } finally {
      setFollowLoading(false);
    }
  }

  async function handleDelete() {
    if (!post || deleting) return;
    if (!window.confirm("게시물을 삭제할까요? 삭제하면 되돌릴 수 없어요.")) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      toast.success("게시물을 삭제했어요.");
      router.back();
    } catch {
      toast.error("게시물을 삭제하지 못했어요. 다시 시도해주세요.");
      setDeleting(false);
    }
  }

  function handleStartEdit() {
    if (!post) return;
    setEditText(post.content);
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
  }

  async function handleSaveEdit() {
    if (!post || savingEdit || !editText.trim()) return;
    setSavingEdit(true);
    try {
      const updated = await updatePost(post.id, {
        content: editText.trim(),
        mediaList: post.mediaList,
        categories: post.categories,
      });
      setPost(updated);
      setEditing(false);
      toast.success("게시물을 수정했어요.");
    } catch {
      toast.error("게시물을 수정하지 못했어요.");
    } finally {
      setSavingEdit(false);
    }
  }

  function handleReply(commentId: number, nickname: string) {
    setReplyTo({ id: commentId, nickname });
    inputRef.current?.focus();
  }

  async function handleDeleteComment(commentId: number) {
    if (!post) return;
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await deleteComment(post.id, commentId);
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
      toast.error("댓글을 삭제하지 못했어요.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !userId || submitting || !post) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(post.id, { content: commentText.trim(), parentId: replyTo?.id });
      if (replyTo) {
        setComments((prev) => prev.map((c) => c.id === replyTo.id ? { ...c, replies: [...c.replies, newComment] } : c));
      } else {
        setComments((prev) => [...prev, newComment]);
      }
      setCommentText("");
      setReplyTo(null);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch { /* */ } finally {
      setSubmitting(false);
    }
  }

  const isMyPost = userId != null && post != null && String(post.author.id) === userId;
  const images = post?.mediaList.map((m) => m.url) ?? [];
  const liked = likeState?.liked ?? false;
  const likeCount = likeState?.likeCount ?? 0;
  const isBookmarked = bookmarked ?? false;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-500">{error ?? "게시물을 불러오지 못했습니다."}</p>
        <button type="button" onClick={() => router.back()} className="text-sm text-[#2E7DF2]">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* 뒤로가기 헤더 */}
      <header className="flex items-center border-b border-black/5 px-2 py-2 shrink-0">
        <button type="button" onClick={() => router.back()} className="grid size-9 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1" />
        {isMyPost && !editing && (
          <>
            <button
              type="button"
              onClick={handleStartEdit}
              className="grid size-9 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="grid size-9 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
            >
              <Trash2 size={19} />
            </button>
          </>
        )}
      </header>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {/* 이미지 캐러셀 */}
        {images.length > 0 && (
          <div className="relative w-full overflow-hidden bg-zinc-100" style={{ aspectRatio: "1/1" }}>
            <div
              className="flex h-full transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${imgIndex * 100}%)` }}
            >
              {images.map((src, i) => (
                <button key={i} type="button" onClick={() => setLightboxIndex(i)} className="h-full w-full shrink-0">
                  <img src={src} alt={`이미지 ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {images.length > 1 && (
              <>
                {imgIndex > 0 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImgIndex((i) => i - 1); }} className="absolute left-3 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-white/90 shadow text-zinc-800">
                    <ChevronLeft size={18} />
                  </button>
                )}
                {imgIndex < images.length - 1 && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImgIndex((i) => i + 1); }} className="absolute right-3 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-white/90 shadow text-zinc-800">
                    <ChevronRight size={18} />
                  </button>
                )}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} type="button" onClick={(e) => { e.stopPropagation(); setImgIndex(i); }} className={`size-1.5 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 이미지 lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
              onClick={() => setLightboxIndex(null)}
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <X size={20} />
              </button>
              {images.length > 1 && lightboxIndex > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i ?? 0) - 1); }}
                  className="absolute left-3 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              <motion.img
                key={lightboxIndex}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.18 }}
                src={images[lightboxIndex]}
                alt={`이미지 ${lightboxIndex + 1}`}
                className="max-h-[90dvh] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              {images.length > 1 && lightboxIndex < images.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i ?? 0) + 1); }}
                  className="absolute right-3 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight size={22} />
                </button>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {images.map((_, i) => (
                    <div key={i} className={`size-1.5 rounded-full transition-colors ${i === lightboxIndex ? "bg-white" : "bg-white/30"}`} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/5">
          <button type="button" onClick={() => router.push(`/community/users/${post.author.id}`)} className="shrink-0">
            {post.author.profileImageUrl ? (
              <img src={post.author.profileImageUrl} alt={post.author.nickname} className="size-9 rounded-full object-cover" />
            ) : (
              <div className="size-9 rounded-full bg-zinc-200" />
            )}
          </button>
          <button type="button" onClick={() => router.push(`/community/users/${post.author.id}`)} className="flex-1 text-left">
            <p className="text-sm font-semibold">{post.author.nickname}</p>
          </button>
          {!isMyPost && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={followLoading}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                following ? "border border-zinc-200 text-zinc-600" : "bg-[#2E7DF2] text-white"
              }`}
            >
              {followLoading ? "..." : following ? "팔로잉" : "팔로우"}
            </button>
          )}
        </div>

        {/* 액션 바 */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button type="button" onClick={toggleLike} className="flex items-center gap-1.5 transition-transform active:scale-90">
            <Heart size={24} className={liked ? "fill-red-500 stroke-red-500" : "stroke-zinc-700"} />
            <span className="text-sm font-semibold text-zinc-700">{likeCount}</span>
          </button>
          <button type="button" onClick={openComments} className="flex items-center gap-1.5 text-zinc-700">
            <MessageCircle size={24} />
            <span className="text-sm font-semibold">{post.commentCount}</span>
          </button>
          <button type="button" onClick={toggleBookmark} className="ml-auto transition-transform active:scale-90">
            <Bookmark size={24} className={isBookmarked ? "fill-zinc-800 stroke-zinc-800" : "stroke-zinc-700"} />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-4 pb-3">
          {post.categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {post.categories.map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#2E7DF2]">#{tag}</span>
              ))}
            </div>
          )}
          {editing ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                autoFocus
                className="w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm text-zinc-800 outline-none focus:border-[#2E7DF2]"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingEdit}
                  className="rounded-full px-4 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editText.trim()}
                  className="rounded-full bg-[#2E7DF2] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {savingEdit ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-line">{post.content}</p>
          )}
        </div>

        {/* 위치 */}
        {post.placeTags.length > 0 && (
          <div className="mx-4 mb-4 flex items-center gap-1.5 rounded-xl bg-zinc-50 px-3 py-2.5">
            <MapPin size={14} className="text-[#2E7DF2] shrink-0" />
            <span className="text-xs text-zinc-600">위치 태그 있음</span>
          </div>
        )}

        {/* 댓글 버튼 */}
        <button
          type="button"
          onClick={openComments}
          className="mx-4 mb-6 w-[calc(100%-2rem)] rounded-xl border border-zinc-200 py-2.5 text-sm text-zinc-500 hover:bg-zinc-50"
        >
          댓글 {post.commentCount}개 보기
        </button>
      </div>

      {/* 댓글 전체화면 */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col bg-white rounded-t-2xl"
            style={{ height: "45%" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex items-center border-b px-4 py-3 shrink-0">
              <h3 className="flex-1 text-sm font-bold">댓글 {post.commentCount}개</h3>
              <button type="button" onClick={() => setShowComments(false)} className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {commentsLoading && (
                <div className="flex justify-center py-6">
                  <div className="size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-[#2E7DF2]" />
                </div>
                )}
                {!commentsLoading && comments.length === 0 && (
                  <p className="text-sm text-zinc-400">첫 댓글을 남겨보세요</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className="space-y-4">
                    <CommentItem comment={c} postId={post.id} userId={userId} onReply={handleReply} onDelete={handleDeleteComment} />
                    {c.replies.map((reply) => (
                      <CommentItem key={reply.id} comment={reply} postId={post.id} userId={userId} onReply={handleReply} onDelete={handleDeleteComment} isReply />
                    ))}
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
              <div className="border-t shrink-0">
                {replyTo && (
                  <div className="flex items-center justify-between bg-zinc-50 px-4 py-2">
                    <span className="text-xs text-zinc-500">{replyTo.nickname}에게 답글</span>
                    <button type="button" onClick={() => setReplyTo(null)} className="text-zinc-400"><X size={13} /></button>
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
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || !userId || submitting}
                    className="grid size-8 place-items-center rounded-full text-[#2E7DF2] transition-colors disabled:text-zinc-300"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
