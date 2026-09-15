"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleDollarSign, Clock, ExternalLink, Heart, Moon, MapPin, SquareParking, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/axios";
import { getPlaceDetail, getPlaceKakaoLink } from "@/lib/api/places";
import { addWishlist, getMyWishlist, removeWishlist } from "@/lib/api/wishlists";
import type { PlaceDetail, PlaceImage, PlaceKakaoLink } from "@/types/api/place";

const INFO_ICONS = {
  hours: Clock,
  closed: Moon,
  fee: CircleDollarSign,
  parking: SquareParking,
} as const;

type Tab = "kakao" | "info";

function stripHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function InfoIcon({ kind }: { kind: keyof typeof INFO_ICONS }) {
  const Icon = INFO_ICONS[kind];
  return <Icon size={16} aria-hidden />;
}

function HeroGallery({ images }: { images: PlaceImage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(images.length - 1, idx)));
  }

  return (
    <div className="relative h-56 w-full shrink-0 bg-zinc-100">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>
      {images.length > 1 && (
        <div className="absolute right-3 bottom-3 z-10 flex gap-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 장소 상세.
 *
 * 기본은 카카오맵 장소 페이지를 앱 안에 띄운다. 후기·사진·영업 정보가 계속 갱신되기 때문이다.
 * 우리 DB 에 적재한 소개·운영시간은 "기본 정보" 탭에 그대로 남긴다.
 */
export default function PlaceDetailSheet({
  placeId,
  onClose,
  onWishlistChange,
}: {
  placeId: number | null;
  onClose: () => void;
  /** 하트를 눌러 담기·빼기가 끝났을 때. 위시리스트 화면이 목록을 맞춘다 */
  onWishlistChange?: (placeId: number, wishlisted: boolean) => void;
}) {
  // 상위에 transform 이 걸린 화면(PageFade, 피드 모달)에서는 fixed 가 화면이 아니라 그 요소를 기준으로
  // 잡힌다. body 로 옮겨 그린다.
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState<Tab>("kakao");
  const [result, setResult] = useState<{
    placeId: number;
    data: PlaceDetail | null;
    error: boolean;
  } | null>(null);
  const [kakao, setKakao] = useState<{
    placeId: number;
    link: PlaceKakaoLink | null;
    error: boolean;
  } | null>(null);
  // 카카오 페이지는 뜨는 데 10초 넘게 걸리기도 한다. 다 뜰 때까지 가림막을 둔다.
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  useEffect(() => {
    let inner = 0;
    // 그린 다음 프레임에 올려야 아래에서 올라오는 전환이 보인다.
    const outer = requestAnimationFrame(() => {
      setPortalTarget(document.body);
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  useEffect(() => {
    if (placeId == null) return;
    let cancelled = false;
    getPlaceDetail(placeId)
      .then((data) => {
        if (!cancelled) setResult({ placeId, data, error: false });
      })
      .catch((e) => {
        if (cancelled) return;
        setResult({ placeId, data: null, error: true });
        if (!(e instanceof ApiError)) console.error(e);
      });
    getPlaceKakaoLink(placeId)
      .then((link) => {
        if (!cancelled) setKakao({ placeId, link, error: false });
      })
      .catch(() => {
        if (!cancelled) setKakao({ placeId, link: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const { status: sessionStatus } = useSession();
  const [wish, setWish] = useState<{ placeId: number; wishlisted: boolean } | null>(null);
  const [wishBusy, setWishBusy] = useState(false);

  const loadedDetail = result?.placeId === placeId ? result.data : null;
  const serverWishlisted = loadedDetail?.wishlisted;
  // 상세 응답이 담긴 여부를 주지 않는 서버 버전일 때만 내 위시리스트에서 찾는다.
  // 이 경우 서버가 한 번에 주는 50곳 안에서만 판단할 수 있다.
  const needsLookup = loadedDetail != null && serverWishlisted === undefined;

  useEffect(() => {
    if (placeId == null || sessionStatus !== "authenticated" || !needsLookup) return;
    let cancelled = false;
    getMyWishlist()
      .then((res) => {
        if (!cancelled) {
          setWish({ placeId, wishlisted: res.items.some((item) => item.placeId === placeId) });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [placeId, sessionStatus, needsLookup]);

  const wishlisted =
    wish?.placeId === placeId
      ? wish.wishlisted
      : typeof serverWishlisted === "boolean" && sessionStatus === "authenticated"
        ? serverWishlisted
        : null;

  async function toggleWishlist() {
    if (placeId == null || wishlisted == null || wishBusy) return;
    setWishBusy(true);
    try {
      const res = wishlisted ? await removeWishlist(placeId) : await addWishlist(placeId);
      setWish({ placeId, wishlisted: res.wishlisted });
      onWishlistChange?.(placeId, res.wishlisted);
      toast.success(res.wishlisted ? "찜한 장소에 담았어요." : "찜한 장소에서 뺐어요.");
    } catch {
      toast.error("찜하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setWishBusy(false);
    }
  }

  const detail = loadedDetail;
  const detailLoading = placeId != null && result?.placeId !== placeId;
  const detailError = result?.placeId === placeId && result.error;

  const kakaoLink = kakao?.placeId === placeId ? kakao.link : null;
  const kakaoLoading = placeId != null && kakao?.placeId !== placeId;
  const kakaoError = kakao?.placeId === placeId && kakao.error;
  const frameReady = kakaoLink != null && loadedUrl === kakaoLink.url;

  const hours = stripHtml(detail?.operatingInfo?.openingHoursText);
  const closed = stripHtml(detail?.operatingInfo?.closedDaysText);
  const fee = stripHtml(detail?.operatingInfo?.useFeeText);
  const parking = stripHtml(detail?.operatingInfo?.parkingText);
  const hasInfo = hours || closed || fee || parking;

  if (!portalTarget) return null;

  return createPortal(
    // 포털이어도 React 이벤트는 부모 컴포넌트로 전파된다. 모달의 바깥 클릭 닫기 등에 닿지 않게 끊는다.
    <div className="fixed inset-0 z-[60] flex justify-center" onClick={(e) => e.stopPropagation()}>
      <div className="relative flex w-full max-w-lg flex-col justify-end">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            shown ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`relative flex h-[88dvh] flex-col overflow-hidden rounded-t-3xl bg-white transition-transform duration-300 ease-out ${
            shown ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex justify-center pt-2">
            <div className="h-1 w-10 rounded-full bg-zinc-200" />
          </div>

          <div className="flex items-start gap-2 px-5 pt-2 pb-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-zinc-900">
                {detail?.name ?? (detailLoading ? "불러오는 중..." : "장소")}
              </h2>
              {detail?.address && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
                  <MapPin size={12} className="shrink-0" aria-hidden />
                  <span className="truncate">{detail.address}</span>
                </p>
              )}
            </div>
            {detail && wishlisted != null && (
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={wishBusy}
                aria-label={wishlisted ? "찜 해제" : "찜하기"}
                aria-pressed={wishlisted}
                className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 disabled:opacity-60"
              >
                <Heart
                  size={20}
                  aria-hidden
                  className={wishlisted ? "fill-[#F16E5E] stroke-[#F16E5E]" : ""}
                />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="flex gap-1 border-b border-zinc-100 px-5" role="tablist">
            {(
              [
                { key: "kakao", label: "카카오맵" },
                { key: "info", label: "기본 정보" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                onClick={() => setTab(item.key)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                  tab === item.key
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 탭을 오가도 카카오 페이지를 다시 불러오지 않게 둘 다 띄워 두고 보이기만 바꾼다. */}
          <div className={`relative flex-1 flex-col ${tab === "kakao" ? "flex" : "hidden"}`}>
            {kakaoLink && (
              <iframe
                key={kakaoLink.url}
                src={kakaoLink.url}
                title={`${detail?.name ?? "장소"} 카카오맵`}
                onLoad={() => setLoadedUrl(kakaoLink.url)}
                allow="geolocation"
                className="absolute inset-0 h-full w-full border-0"
              />
            )}

            {(kakaoLoading || (kakaoLink && !frameReady)) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white">
                <div className="size-7 animate-spin rounded-full border-4 border-zinc-200 border-t-[#FEE500]" />
                <p className="text-sm text-zinc-400">카카오맵을 불러오는 중...</p>
              </div>
            )}

            {kakaoError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm text-zinc-500">카카오맵 정보를 불러오지 못했어요.</p>
                <button
                  type="button"
                  onClick={() => setTab("info")}
                  className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600"
                >
                  기본 정보 보기
                </button>
              </div>
            )}
          </div>

          {tab === "kakao" && kakaoLink && (
            <div className="flex items-center gap-2 border-t border-zinc-100 px-5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
              <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                {kakaoLink.matched ? "카카오맵 장소 정보" : "정확한 장소를 찾지 못해 검색 결과를 보여줘요"}
              </p>
              <a
                href={kakaoLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1 rounded-full bg-[#FEE500] px-3 py-1.5 text-xs font-semibold text-zinc-900"
              >
                카카오맵에서 열기
                <ExternalLink size={12} aria-hidden />
              </a>
            </div>
          )}

          <div className={`flex-1 overflow-y-auto pb-8 ${tab === "info" ? "block" : "hidden"}`}>
            {detailLoading && (
              <p className="py-10 text-center text-sm text-zinc-400">불러오는 중...</p>
            )}

            {!detailLoading && detailError && (
              <p className="py-10 text-center text-sm text-zinc-400">장소 정보를 불러오지 못했어요.</p>
            )}

            {!detailLoading && detail && (
              <>
                {detail.images.length > 0 && <HeroGallery images={detail.images} />}

                <div className="flex flex-col gap-4 px-5 pt-4">
                  {detail.overview ? (
                    <p className="text-sm leading-relaxed text-zinc-600">{stripHtml(detail.overview)}</p>
                  ) : (
                    !hasInfo && (
                      <p className="py-6 text-center text-sm text-zinc-400">
                        등록된 기본 정보가 없어요. 카카오맵 탭에서 확인해 주세요.
                      </p>
                    )
                  )}

                  {hasInfo && (
                    <div className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-black/5">
                      {hours && <InfoRow kind="hours" label="운영시간" value={hours} color="text-[#2E7DF2]" />}
                      {closed && <InfoRow kind="closed" label="휴무일" value={closed} color="text-[#F16E5E]" />}
                      {fee && <InfoRow kind="fee" label="이용요금" value={fee} color="text-[#E4820B]" />}
                      {parking && <InfoRow kind="parking" label="주차" value={parking} color="text-[#17B89B]" />}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    portalTarget,
  );
}

function InfoRow({
  kind,
  label,
  value,
  color,
}: {
  kind: keyof typeof INFO_ICONS;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3.5">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full bg-white shadow-sm ${color}`}>
        <InfoIcon kind={kind} />
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-[11px] font-semibold text-zinc-400">{label}</p>
        <p className="mt-0.5 text-sm text-zinc-700">{value}</p>
      </div>
    </div>
  );
}
