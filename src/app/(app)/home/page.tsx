"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, LoaderCircle, MapPin } from "lucide-react";
import { toast } from "sonner";

import HomeHeader from "@/components/layout/HomeHeader";
import PlaceDetailSheet from "@/components/sheet/PlaceDetailSheet";
import PageFade from "@/components/ui/PageFade";
import { getPopularPlaces, resolvePlace, searchPlaces } from "@/lib/api/places";
import { getPopularFeed } from "@/lib/api/posts";
import { getUserProfile } from "@/lib/api/users";
import type { PlaceSummary } from "@/types/api/place";
import type { FeedPost } from "@/types/api/post";

const POPULAR_FALLBACK_IMAGES = [
  "/trips-covers/destination-gwangalli-millak.png",
  "/trips-covers/destination-gamcheon-sunset.png",
];

const POPULAR_FALLBACK_PLACES = [
  {
    key: "gwangalli",
    imageUrl: POPULAR_FALLBACK_IMAGES[0],
    subtitle: "해운대 · 광안리",
    keyword: "광안리해수욕장",
  },
  {
    key: "gamcheon",
    imageUrl: POPULAR_FALLBACK_IMAGES[1],
    subtitle: "감천문화마을 · 태종대",
    keyword: "감천문화마을",
  },
] as const;

const COMMUNITY_FALLBACK_IMAGES = [
  "/trips-covers/cover-coastal-temple.png",
  "/trips-covers/cover-harbor-market.png",
];

function avatarLabel(name: string | null | undefined) {
  const normalized = (name ?? "누비").replace(/[0-9\s_-]/g, "");
  if (/^[가-힣]+$/.test(normalized) && normalized.length >= 3) {
    return normalized.slice(1, 3);
  }
  return normalized.slice(0, 2).toUpperCase() || "누비";
}

function greetingName(name: string | null | undefined) {
  const normalized = (name ?? "").replace(/\d+/g, "").trim();
  return normalized || null;
}

function CardImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized={src.startsWith("http")}
      sizes="(max-width: 512px) 46vw, 235px"
      className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
    />
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [userName, setUserName] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loadedProfileUserId, setLoadedProfileUserId] = useState<number | null>(null);
  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [popularPlaces, setPopularPlaces] = useState<PlaceSummary[]>([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [resolvingFallback, setResolvingFallback] = useState<string | null>(null);
  const [fallbackPlaceIds, setFallbackPlaceIds] = useState<Record<string, number>>({});
  const [detailPlaceId, setDetailPlaceId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    void getPopularFeed({ size: 2 })
      .then((response) => {
        if (!cancelled) setCommunityPosts(response.items.slice(0, 2));
      })
      .catch(() => {});
    void getPopularPlaces({ size: 2 })
      .then((response) => {
        if (!cancelled) setPopularPlaces(response.items.slice(0, 2));
      })
      .catch(() => {
        if (!cancelled) setPopularPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setPopularLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    const userId = session?.user?.id != null ? Number(session.user.id) : null;
    if (!userId) return;
    let cancelled = false;

    getUserProfile(userId)
      .then((profile) => {
        if (cancelled) return;
        setUserName(profile.nickname);
        setProfileImageUrl(profile.profileImageUrl);
      })
      .catch(() => {
        if (!cancelled) setUserName(session?.user?.name ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoadedProfileUserId(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const displayName = greetingName(userName ?? session?.user?.name);
  const displayProfileImage = profileImageUrl ?? session?.user?.image ?? null;
  const sessionUserId = session?.user?.id != null ? Number(session.user.id) : null;
  const profileLoading =
    status === "loading" ||
    (sessionUserId !== null && loadedProfileUserId !== sessionUserId && !displayProfileImage);

  async function openFallbackPlace(place: (typeof POPULAR_FALLBACK_PLACES)[number]) {
    if (resolvingFallback) return;

    const cachedPlaceId = fallbackPlaceIds[place.key];
    if (cachedPlaceId != null) {
      setDetailPlaceId(cachedPlaceId);
      return;
    }

    setResolvingFallback(place.key);
    try {
      const response = await searchPlaces(place.keyword);
      const exactMatch = response.items.find((item) => item.name.includes(place.keyword));
      const match = exactMatch ?? response.items[0];
      if (!match) throw new Error("추천 장소를 찾지 못했습니다.");

      const resolvedPlaceId =
        match.placeId !== null && match.resolved
          ? match.placeId
          : (await resolvePlace(match)).placeId;
      setFallbackPlaceIds((current) => ({ ...current, [place.key]: resolvedPlaceId }));
      setDetailPlaceId(resolvedPlaceId);
    } catch {
      toast.error("장소 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setResolvingFallback(null);
    }
  }

  return (
    <PageFade className="flex min-h-full shrink-0 flex-col bg-[#f8fbff] text-[#0b2146]">
      <HomeHeader
        profileImageUrl={displayProfileImage}
        profileLabel={avatarLabel(displayName)}
        profileLoading={profileLoading}
      />

      <section className="relative h-[clamp(6rem,24vw,7.5rem)] shrink-0 overflow-hidden">
        <Image
          src="/trips-covers/cover-gwangalli.png"
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 512px"
          className="pointer-events-none scale-x-[-1] object-cover object-[50%_30%] opacity-45"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/20 via-white/14 to-[#f8fbff]" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/90 via-white/35 to-white/5" />

        <h1 className="absolute inset-x-4 bottom-2 text-[clamp(1.25rem,5vw,1.55rem)] leading-[1.45] font-extrabold tracking-[-0.045em] text-[#081c3d]">
          어서오세요{displayName ? ` ${displayName}님` : ""},
          <br />
          오늘은 어디로 떠날까요?
        </h1>
      </section>

      <div className="relative z-10 -mt-1 space-y-7 px-4 pb-9">
        <section className="relative min-h-[12.5rem] overflow-hidden rounded-[1.65rem] border border-white bg-white shadow-[0_12px_32px_rgba(41,100,160,0.12)]">
          <Image
            src="/trips-covers/cover-gwangalli.png"
            alt="광안대교와 부산 바다"
            fill
            sizes="(max-width: 512px) 100vw, 512px"
            className="object-cover object-[50%_34%]"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <path
              d="M0 0H61C56 9 53 19 50 31C47 46 44 64 40 79C38 88 36 95 34 100H0Z"
              fill="white"
            />
          </svg>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-linear-to-r from-white via-white/98 to-transparent" />

          <div className="relative z-10 flex min-h-[12.5rem] max-w-[60%] flex-col items-start p-5">
            <h2 className="text-[clamp(1.15rem,4.7vw,1.45rem)] font-extrabold tracking-[-0.04em] text-[#123d86]">
              AI 맞춤 일정 만들기
            </h2>
            <p className="mt-2 text-[clamp(0.78rem,3.1vw,0.94rem)] leading-7 font-medium text-[#5f718b]">
              취향만 알려주면 3분 만에
              <br />
              완벽한 여행 코스를 짜드려요
            </p>
            <Link
              href="/trips/new/date"
              className="mt-auto inline-flex items-center gap-2 rounded-full bg-[#2E7DF2] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(46,125,242,0.25)] transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              시작하기
              <ArrowRight size={18} strokeWidth={2.35} />
            </Link>
          </div>

        </section>

        <section>
          <h2 className="mb-3 text-xl font-extrabold tracking-[-0.04em] text-[#0b2146]">
            지금 인기 여행지
          </h2>
          {popularLoading ? (
            <div className="grid grid-cols-2 gap-3" aria-label="인기 여행지를 불러오는 중">
              {[0, 1].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_24px_rgba(38,83,133,0.08)] ring-1 ring-[#e4edf7]"
                >
                  <div className="aspect-3/2 animate-pulse bg-[#eaf3fb]" />
                  <div className="space-y-2 px-3.5 py-3">
                    <div className="h-4 w-16 animate-pulse rounded-full bg-[#e7eef6]" />
                    <div className="h-3 w-24 animate-pulse rounded-full bg-[#eef3f8]" />
                  </div>
                </div>
              ))}
            </div>
          ) : popularPlaces.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {popularPlaces.map((place, index) => {
                const imageUrl = place.primaryImageUrl || POPULAR_FALLBACK_IMAGES[index % POPULAR_FALLBACK_IMAGES.length];
                return (
                  <button
                    key={place.placeId}
                    type="button"
                    onClick={() => setDetailPlaceId(place.placeId)}
                    className="group overflow-hidden rounded-[1.35rem] bg-white text-left shadow-[0_8px_24px_rgba(38,83,133,0.1)] ring-1 ring-[#e4edf7]"
                  >
                    <span className="relative block aspect-3/2 overflow-hidden bg-[#eaf3fb]">
                      <CardImage src={imageUrl} alt={place.name} />
                    </span>
                    <span className="block px-3.5 py-3">
                      <span className="flex items-center gap-2 text-base font-extrabold tracking-[-0.03em] text-[#102750]">
                        <MapPin size={18} strokeWidth={2.3} className="shrink-0 text-[#2E7DF2]" />
                        부산
                      </span>
                      <span className="mt-1 block truncate pl-[1.65rem] text-xs font-medium text-[#8996aa]">
                        {[place.name, place.categoryLabel].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {POPULAR_FALLBACK_PLACES.map((place) => {
                const resolving = resolvingFallback === place.key;
                return (
                  <button
                    key={place.key}
                    type="button"
                    onClick={() => void openFallbackPlace(place)}
                    disabled={resolvingFallback !== null}
                    aria-busy={resolving}
                    className="group overflow-hidden rounded-[1.35rem] bg-white text-left shadow-[0_8px_24px_rgba(38,83,133,0.1)] ring-1 ring-[#e4edf7] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
                  >
                    <span className="relative block aspect-3/2 overflow-hidden bg-[#eaf3fb]">
                      <CardImage src={place.imageUrl} alt={place.subtitle} />
                      {resolving && (
                        <span className="absolute inset-0 grid place-items-center bg-[#0b2146]/20" aria-hidden>
                          <LoaderCircle className="animate-spin text-white" size={28} strokeWidth={2.5} />
                        </span>
                      )}
                    </span>
                    <span className="block px-3.5 py-3">
                      <span className="flex items-center gap-2 text-base font-extrabold tracking-[-0.03em] text-[#102750]">
                        <MapPin size={18} strokeWidth={2.3} className="shrink-0 text-[#2E7DF2]" />
                        부산
                      </span>
                      <span className="mt-1 block truncate pl-[1.65rem] text-xs font-medium text-[#8996aa]">
                        {place.subtitle}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {communityPosts.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-extrabold tracking-[-0.04em] text-[#0b2146]">
              커뮤니티 인기글
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {communityPosts.map((post, index) => {
                const imageUrl = post.thumbnailUrl || COMMUNITY_FALLBACK_IMAGES[index % COMMUNITY_FALLBACK_IMAGES.length];
                return (
                  <Link
                    key={post.id}
                    href={`/community/posts/${post.id}`}
                    className="group overflow-hidden rounded-[1.35rem] bg-white shadow-[0_8px_24px_rgba(38,83,133,0.1)] ring-1 ring-[#e4edf7]"
                  >
                    <span className="relative block aspect-3/2 overflow-hidden bg-[#eaf3fb]">
                      <CardImage
                        src={imageUrl}
                        alt={post.placeName ?? post.content}
                      />
                    </span>
                    <span className="block px-3.5 py-3">
                      <span className="block truncate text-sm font-extrabold tracking-[-0.025em] text-[#102750]">
                        {post.author.nickname}
                      </span>
                      <span className="mt-1 block truncate text-xs font-medium text-[#8996aa]">
                        {post.categories[0] ?? "여행후기"} · 댓글 {post.commentCount}
                      </span>
                    </span>
                  </Link>
                );
              })}
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
