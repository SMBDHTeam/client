"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, MessageCircle, MapPin, X, Send, ChevronLeft, ChevronRight } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import PageFade from "@/components/ui/PageFade";
import { COMMUNITY_TAGS, type CommunityTagId } from "@/mocks/community-tags";

type Comment = {
  id: number;
  author: string;
  text: string;
};

type Post = {
  id: number;
  author: string;
  avatar: string;
  images: string[];
  location: string;
  description: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  tags: CommunityTagId[];
};

const DUMMY_POSTS: Post[] = [
  {
    id: 1,
    author: "여행자_민지",
    avatar: "https://i.pravatar.cc/40?img=1",
    images: ["https://picsum.photos/seed/busan1/600/600", "https://picsum.photos/seed/busan1b/600/600", "https://picsum.photos/seed/busan1c/600/600"],
    location: "해운대 해수욕장",
    description: "해운대에서 맞이한 일몰 🌅 부산 최고다",
    likes: 42,
    likedByMe: false,
    tags: ["healing", "nature"],
    comments: [
      { id: 1, author: "바다사랑", text: "너무 예쁘다!!" },
      { id: 2, author: "travel_99", text: "저도 가고싶어요 ㅠㅠ" },
    ],
  },
  {
    id: 2,
    author: "부산_탐험가",
    avatar: "https://i.pravatar.cc/40?img=2",
    images: ["https://picsum.photos/seed/busan2/600/600", "https://picsum.photos/seed/busan2b/600/600"],
    location: "광안리 해수욕장",
    description: "광안대교랑 같이 찍은 사진 🌉",
    likes: 87,
    likedByMe: true,
    tags: ["night", "healing"],
    comments: [
      { id: 1, author: "민수야", text: "광안대교 야경 진짜 최고" },
    ],
  },
  {
    id: 3,
    author: "푸드러버",
    avatar: "https://i.pravatar.cc/40?img=3",
    images: ["https://picsum.photos/seed/busan3/600/600"],
    location: "깡통시장",
    description: "부산 깡통시장 야시장 🍢 먹거리 천국",
    likes: 31,
    likedByMe: false,
    tags: ["food", "shopping"],
    comments: [],
  },
  {
    id: 4,
    author: "감성여행",
    avatar: "https://i.pravatar.cc/40?img=4",
    images: ["https://picsum.photos/seed/busan4/600/600", "https://picsum.photos/seed/busan4b/600/600", "https://picsum.photos/seed/busan4c/600/600"],
    location: "감천문화마을",
    description: "알록달록 감천문화마을 🎨",
    likes: 120,
    likedByMe: false,
    tags: ["history", "healing"],
    comments: [
      { id: 1, author: "사진작가", text: "구도가 너무 예쁘네요" },
      { id: 2, author: "여행러", text: "감천은 진짜 포토스팟 맛집" },
      { id: 3, author: "민지언니", text: "같이 가고 싶었는데ㅠ" },
    ],
  },
  {
    id: 5,
    author: "해피트래블",
    avatar: "https://i.pravatar.cc/40?img=5",
    images: ["https://picsum.photos/seed/busan5/600/600", "https://picsum.photos/seed/busan5b/600/600"],
    location: "태종대",
    description: "태종대 절벽 위에서 본 풍경 😮",
    likes: 56,
    likedByMe: false,
    tags: ["nature", "activity"],
    comments: [],
  },
  {
    id: 6,
    author: "카페호퍼",
    avatar: "https://i.pravatar.cc/40?img=6",
    images: ["https://picsum.photos/seed/busan6/600/600"],
    location: "흰여울문화마을",
    description: "흰여울 카페에서 커피 한 잔 ☕ 뷰가 장난 아님",
    likes: 78,
    likedByMe: true,
    tags: ["cafe", "healing"],
    comments: [
      { id: 1, author: "커피러버", text: "여기 어디 카페에요?" },
    ],
  },
  {
    id: 7,
    author: "산악인_준호",
    avatar: "https://i.pravatar.cc/40?img=7",
    images: ["https://picsum.photos/seed/busan7/600/600", "https://picsum.photos/seed/busan7b/600/600"],
    location: "금정산",
    description: "금정산 등반 완료 🏔️ 뷰 실화냐",
    likes: 19,
    likedByMe: false,
    tags: ["nature", "activity"],
    comments: [],
  },
  {
    id: 8,
    author: "시장탐방",
    avatar: "https://i.pravatar.cc/40?img=8",
    images: ["https://picsum.photos/seed/busan8/600/600", "https://picsum.photos/seed/busan8b/600/600", "https://picsum.photos/seed/busan8c/600/600"],
    location: "자갈치시장",
    description: "자갈치시장에서 회 한 접시 🐟",
    likes: 63,
    likedByMe: false,
    tags: ["food", "shopping"],
    comments: [
      { id: 1, author: "맛집헌터", text: "얼마였어요?" },
      { id: 2, author: "회고수", text: "신선해 보인다" },
    ],
  },
  {
    id: 9,
    author: "야경킬러",
    avatar: "https://i.pravatar.cc/40?img=9",
    images: ["https://picsum.photos/seed/busan9/600/600"],
    location: "부산타워",
    description: "부산타워에서 내려다 본 야경 ✨",
    likes: 95,
    likedByMe: false,
    tags: ["night"],
    comments: [
      { id: 1, author: "밤산책러", text: "야경 미쳤다" },
    ],
  },
];

const ASPECT_RATIOS = ["aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-square", "aspect-[4/5]"];

function GridTile({ post, onClick, index }: { post: Post; onClick: () => void; index: number }) {
  const aspectClass = ASPECT_RATIOS[index % ASPECT_RATIOS.length];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative mb-2 w-full overflow-hidden rounded-2xl bg-zinc-100 ${aspectClass}`}
    >
      <img
        src={post.images[0]}
        alt={post.location}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      {post.images.length > 1 && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/40 px-1.5 py-0.5">
          <span className="text-[10px] font-semibold text-white">{post.images.length}</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="truncate text-xs font-semibold text-white drop-shadow">{post.location}</p>
        <div className="mt-0.5 flex gap-2 text-[11px] text-white/80">
          <span className="flex items-center gap-0.5"><Heart size={10} className="fill-white/80 stroke-none" /> {post.likes}</span>
          <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {post.comments.length}</span>
        </div>
      </div>
    </button>
  );
}

function CommentSheet({
  post,
  onClose,
  onAddComment,
}: {
  post: Post;
  onClose: () => void;
  onAddComment: (postId: number, text: string) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
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
        <h3 className="flex-1 text-sm font-bold">댓글 {post.comments.length}개</h3>
        <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {post.comments.length === 0 && (
          <p className="text-xs text-zinc-400">첫 댓글을 남겨보세요</p>
        )}
        {post.comments.map((c) => (
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
  onClose,
  onToggleLike,
  onAddComment,
}: {
  post: Post;
  onClose: () => void;
  onToggleLike: (id: number) => void;
  onAddComment: (postId: number, text: string) => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);

  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white"
      style={{ maxHeight: "90dvh" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <img src={post.avatar} alt={post.author} className="size-8 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{post.author}</p>
          <p className="flex items-center gap-1 text-xs text-zinc-400"><MapPin size={10} />{post.location}</p>
        </div>
        <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100"><X size={16} /></button>
      </div>

      <div className="relative aspect-square w-full overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${imgIndex * 100}%)` }}
        >
          {post.images.map((src, i) => (
            <img key={i} src={src} alt={`${post.location} ${i + 1}`} className="h-full w-full shrink-0 object-cover" />
          ))}
        </div>
        {post.images.length > 1 && (
          <>
            {imgIndex > 0 && (
              <button type="button" onClick={() => setImgIndex((i) => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/90 text-zinc-800 shadow">
                <ChevronLeft size={16} />
              </button>
            )}
            {imgIndex < post.images.length - 1 && (
              <button type="button" onClick={() => setImgIndex((i) => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/90 text-zinc-800 shadow">
                <ChevronRight size={16} />
              </button>
            )}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {post.images.map((_, i) => (
                <button key={i} type="button" onClick={() => setImgIndex(i)} className={`size-1.5 rounded-full transition-colors ${i === imgIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 px-4 pt-3 pb-1">
        <button type="button" onClick={() => onToggleLike(post.id)} className="transition-transform active:scale-90">
          <Heart size={24} className={post.likedByMe ? "fill-red-500 stroke-red-500" : "stroke-zinc-700"} />
        </button>
        <button type="button" onClick={() => setShowComments(true)} className="text-zinc-700">
          <MessageCircle size={24} />
        </button>
        <span className="ml-1 text-sm font-semibold">{post.likes}명이 좋아해요</span>
      </div>

      <div className="px-4 pb-2">
        <span className="text-sm font-semibold">{post.author}</span>
        <span className="text-sm text-zinc-700"> {post.description}</span>
      </div>

      <div className="px-4 pb-4 space-y-1 overflow-hidden" style={{ height: "52px" }}>
        {post.comments.slice(0, 2).map((c) => (
          <div key={c.id} className="flex gap-2 text-sm">
            <span className="font-semibold shrink-0">{c.author}</span>
            <span className="text-zinc-700 truncate">{c.text}</span>
          </div>
        ))}
        {post.comments.length > 2 && (
          <button type="button" onClick={() => setShowComments(true)} className="text-xs text-zinc-400 mt-0.5">
            댓글 {post.comments.length}개 모두 보기
          </button>
        )}
        {post.comments.length === 0 && (
          <button type="button" onClick={() => setShowComments(true)} className="text-xs text-zinc-400">
            첫 댓글을 남겨보세요
          </button>
        )}
      </div>

      <AnimatePresence>
        {showComments && (
          <CommentSheet
            post={post}
            onClose={() => setShowComments(false)}
            onAddComment={onAddComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PostModal({
  post,
  onClose,
  onToggleLike,
  onAddComment,
}: {
  post: Post;
  onClose: () => void;
  onToggleLike: (id: number) => void;
  onAddComment: (postId: number, text: string) => void;
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
        onClose={onClose}
        onToggleLike={onToggleLike}
        onAddComment={onAddComment}
      />
    </motion.div>
  );
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(DUMMY_POSTS);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeTag, setActiveTag] = useState<CommunityTagId | null>(null);
  const tagScrollRef = useRef<HTMLDivElement>(null);
  const tagDragRef = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

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

  const filteredPosts = activeTag
    ? posts.filter((p) => p.tags.includes(activeTag))
    : posts;

  function toggleLike(id: number) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
          : p,
      ),
    );
    if (selectedPost?.id === id) {
      setSelectedPost((prev) =>
        prev
          ? { ...prev, likedByMe: !prev.likedByMe, likes: prev.likedByMe ? prev.likes - 1 : prev.likes + 1 }
          : null,
      );
    }
  }

  function addComment(postId: number, text: string) {
    const newComment: Comment = {
      id: Date.now(),
      author: "나",
      text,
    };
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p,
      ),
    );
    setSelectedPost((prev) =>
      prev?.id === postId
        ? { ...prev, comments: [...prev.comments, newComment] }
        : prev,
    );
  }

  const topPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 5);
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

      <div className="flex flex-1 flex-col overflow-y-auto">
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
              onClick={() => setSelectedPost(post)}
              className="group relative h-48 w-36 shrink-0 overflow-hidden rounded-2xl bg-zinc-100"
            >
              <img
                src={post.images[0]}
                alt={post.location}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="truncate text-[11px] font-semibold text-white">{post.location}</p>
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-white/80">
                  <Heart size={9} className="fill-red-400 stroke-none" />
                  <span>{post.likes}</span>
                </div>
              </div>
              <div className="absolute left-2 top-2">
                <img src={post.avatar} alt={post.author} className="size-6 rounded-full border border-white object-cover" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="px-4 pb-2 text-sm font-bold text-zinc-800">최신 피드</h2>
        {filteredPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">해당 태그의 게시물이 없어요</p>
        ) : (
          <div className="flex gap-2 px-3 pb-6">
            {[0, 1].map((col) => (
              <div key={col} className="flex flex-1 flex-col">
                {filteredPosts
                  .filter((_, i) => i % 2 === col)
                  .map((post, i) => (
                    <GridTile
                      key={post.id}
                      post={post}
                      index={col === 0 ? i * 2 : i * 2 + 1}
                      onClick={() => setSelectedPost(post)}
                    />
                  ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {selectedPost && (
          <PostModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onToggleLike={toggleLike}
            onAddComment={addComment}
          />
        )}
      </AnimatePresence>
      </div>
    </PageFade>
  );
}
