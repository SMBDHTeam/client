"use client";

import { useEffect, useRef, useState } from "react";
import { CircleDollarSign, Clock, Moon, MapPin, SquareParking } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getPlaceDetail } from "@/lib/api/places";
import type { PlaceDetail, PlaceImage } from "@/types/api/place";

const INFO_ICONS = {
  hours: Clock,
  closed: Moon,
  fee: CircleDollarSign,
  parking: SquareParking,
} as const;

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

function HeroGallery({
  images,
  name,
  address,
}: {
  images: PlaceImage[];
  name: string;
  address: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(images.length - 1, idx)));
  }

  return (
    <div className="relative h-60 w-full shrink-0 bg-zinc-100">
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

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/5 to-black/20" />

      {images.length > 1 && (
        <div className="absolute top-3 right-3 z-10 flex gap-1">
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

      <div className="absolute inset-x-0 bottom-0 p-5">
        <h2 className="text-xl font-bold text-white drop-shadow-sm">{name}</h2>
        {address && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-white/85">
            <MapPin size={13} aria-hidden />
            {address}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PlaceDetailSheet({
  placeId,
  onClose,
}: {
  placeId: number | null;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [result, setResult] = useState<{
    placeId: number;
    data: PlaceDetail | null;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
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
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const detail = result?.placeId === placeId ? result.data : null;
  const loading = placeId != null && result?.placeId !== placeId;
  const error = result?.placeId === placeId && result.error;

  const hours = stripHtml(detail?.operatingInfo?.openingHoursText);
  const closed = stripHtml(detail?.operatingInfo?.closedDaysText);
  const fee = stripHtml(detail?.operatingInfo?.useFeeText);
  const parking = stripHtml(detail?.operatingInfo?.parkingText);
  const hasInfo = hours || closed || fee || parking;

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
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
          className={`relative flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl bg-white transition-transform duration-300 ease-out ${
            shown ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="absolute inset-x-0 top-2 z-20 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-white/80 shadow-sm" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-3 right-3 z-20 grid size-8 shrink-0 place-items-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/45"
          >
            ✕
          </button>

          <div className="flex-1 overflow-y-auto pb-8">
            {loading && (
              <p className="py-10 text-center text-sm text-zinc-400">
                불러오는 중...
              </p>
            )}

            {!loading && error && (
              <p className="py-10 text-center text-sm text-zinc-400">
                장소 정보를 불러오지 못했어요.
              </p>
            )}

            {!loading && detail && (
              <>
                {detail.images.length > 0 ? (
                  <HeroGallery
                    images={detail.images}
                    name={detail.name}
                    address={detail.address}
                  />
                ) : (
                  <div className="flex h-36 w-full shrink-0 flex-col justify-end bg-linear-to-br from-[#2E7DF2] to-[#17B89B] p-5">
                    <h2 className="text-xl font-bold text-white">{detail.name}</h2>
                    {detail.address && (
                      <p className="mt-1 text-xs font-medium text-white/85">
                        {detail.address}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-4 px-5 pt-4">
                  {detail.overview && (
                    <p className="text-sm leading-relaxed text-zinc-600">
                      {stripHtml(detail.overview)}
                    </p>
                  )}

                  {hasInfo && (
                    <div className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-zinc-50 ring-1 ring-black/5">
                      {hours && (
                        <div className="flex items-start gap-3 p-3.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#2E7DF2] shadow-sm">
                            <InfoIcon kind="hours" />
                          </span>
                          <div className="min-w-0 pt-1">
                            <p className="text-[11px] font-semibold text-zinc-400">
                              운영시간
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-700">{hours}</p>
                          </div>
                        </div>
                      )}
                      {closed && (
                        <div className="flex items-start gap-3 p-3.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#F16E5E] shadow-sm">
                            <InfoIcon kind="closed" />
                          </span>
                          <div className="min-w-0 pt-1">
                            <p className="text-[11px] font-semibold text-zinc-400">
                              휴무일
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-700">{closed}</p>
                          </div>
                        </div>
                      )}
                      {fee && (
                        <div className="flex items-start gap-3 p-3.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#E4820B] shadow-sm">
                            <InfoIcon kind="fee" />
                          </span>
                          <div className="min-w-0 pt-1">
                            <p className="text-[11px] font-semibold text-zinc-400">
                              이용요금
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-700">{fee}</p>
                          </div>
                        </div>
                      )}
                      {parking && (
                        <div className="flex items-start gap-3 p-3.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#17B89B] shadow-sm">
                            <InfoIcon kind="parking" />
                          </span>
                          <div className="min-w-0 pt-1">
                            <p className="text-[11px] font-semibold text-zinc-400">
                              주차
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-700">{parking}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
