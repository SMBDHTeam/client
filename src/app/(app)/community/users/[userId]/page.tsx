"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import { getUserProfile, getUserPosts, followUser, unfollowUser, getFollowers, getFollowings, type UserProfile, type UserSummary } from "@/lib/api/users";
import type { FeedPost } from "@/types/api/post";

export default function UserProfilePage() {
  const router = useRouter();
  const { userId } = useParams<{ userId: string }>();
  const { data: session } = useSession();
  const requesterId = session?.user?.id != null ? String(session.user.id) : undefined;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const [followModal, setFollowModal] = useState<"followers" | "followings" | null>(null);
  const [followList, setFollowList] = useState<UserSummary[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);

  useEffect(() => {
    const id = Number(userId);
    if (!id) return;
    Promise.all([
      getUserProfile(id, requesterId),
      getUserPosts(id, { size: 18 }, requesterId),
    ])
      .then(([prof, feed]) => {
        setProfile(prof);
        setPosts(feed.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, requesterId]);

  async function toggleFollow() {
    if (!requesterId || !profile) return;
    setFollowLoading(true);
    try {
      const result = profile.following
        ? await unfollowUser(profile.id, requesterId)
        : await followUser(profile.id, requesterId);
      setProfile((prev) => prev ? { ...prev, following: result.following, followerCount: result.followerCount } : prev);
    } catch {
      //
    } finally {
      setFollowLoading(false);
    }
  }

  async function openFollowModal(type: "followers" | "followings") {
    setFollowModal(type);
    setFollowList([]);
    setFollowListLoading(true);
    try {
      const id = Number(userId);
      const res = type === "followers"
        ? await getFollowers(id, { size: 50 })
        : await getFollowings(id, { size: 50 });
      setFollowList(res.items);
    } catch {
      //
    } finally {
      setFollowListLoading(false);
    }
  }

  function openPost(post: FeedPost) {
    router.push(`/community/posts/${post.id}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button type="button" onClick={() => router.back()} className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100">
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">{profile?.nickname ?? ""}</h1>
        <div className="size-8" />
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
        </div>
      ) : profile && (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* 프로필 헤더 */}
          <div className="flex flex-col items-center px-5 pt-6 pb-5">
            <div className="size-24 overflow-hidden rounded-full bg-zinc-200">
              {profile.profileImageUrl && (
                <img src={profile.profileImageUrl} alt={profile.nickname} referrerPolicy="no-referrer" className="size-full object-cover" />
              )}
            </div>
            <p className="mt-3 text-base font-bold">{profile.nickname}</p>
            <div className="mt-4 flex w-full justify-around border-y border-zinc-100 py-4">
              <div className="text-center">
                <p className="text-base font-bold">{profile.postCount}</p>
                <p className="text-xs text-zinc-400">게시물</p>
              </div>
              <button type="button" onClick={() => openFollowModal("followers")} className="text-center">
                <p className="text-base font-bold">{profile.followerCount}</p>
                <p className="text-xs text-zinc-400">팔로워</p>
              </button>
              <button type="button" onClick={() => openFollowModal("followings")} className="text-center">
                <p className="text-base font-bold">{profile.followingCount}</p>
                <p className="text-xs text-zinc-400">팔로잉</p>
              </button>
            </div>
          </div>

          {!profile.me && (
            <div className="px-5 pb-4">
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followLoading}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  profile.following
                    ? "border border-zinc-200 text-zinc-700"
                    : "bg-[#2E7DF2] text-white"
                }`}
              >
                {followLoading ? "..." : profile.following ? "팔로잉" : "팔로우"}
              </button>
            </div>
          )}

          {/* 게시물 그리드 */}
          <div className="grid grid-cols-3 gap-0.5">
            {posts.map((post) => (
              <button key={post.id} type="button" onClick={() => openPost(post)} className="relative aspect-square bg-zinc-100">
                {post.thumbnailUrl && (
                  <img src={post.thumbnailUrl} alt={post.content} className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
          {posts.length === 0 && (
            <p className="py-16 text-center text-sm text-zinc-400">게시물이 없어요</p>
          )}
        </div>
      )}

      <AnimatePresence>
        {followModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFollowModal(null)}
          >
            <motion.div
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-white"
              style={{ maxHeight: "70dvh" }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center border-b px-4 py-3">
                <h3 className="flex-1 text-sm font-bold">{followModal === "followers" ? "팔로워" : "팔로잉"}</h3>
                <button type="button" onClick={() => setFollowModal(null)} className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(70dvh - 52px)" }}>
                {followListLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="size-6 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
                  </div>
                ) : followList.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-400">
                    {followModal === "followers" ? "팔로워가 없어요" : "팔로잉이 없어요"}
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {followList.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => { setFollowModal(null); router.push(`/community/users/${u.id}`); }}
                          className="flex w-full items-center gap-3 px-4 py-3 hover:bg-zinc-50"
                        >
                          <div className="size-10 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                            {u.profileImageUrl && <img src={u.profileImageUrl} alt={u.nickname} referrerPolicy="no-referrer" className="size-full object-cover" />}
                          </div>
                          <p className="text-sm font-semibold">{u.nickname}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
