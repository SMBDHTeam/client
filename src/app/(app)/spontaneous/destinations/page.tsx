"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Compass } from "lucide-react";

import PageFade from "@/components/ui/PageFade";
import { ApiError } from "@/lib/api/axios";
import { createCourse } from "@/lib/api/spontaneous-trips";
import {
  getSpontaneousCourseErrorPresentation,
  type SpontaneousCourseFailure,
} from "@/lib/spontaneous-course-error";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import type { Destination } from "@/types/api/spontaneous-trip";

const TRANSPORT_LABEL: Record<string, string> = {
  PUBLIC_TRANSIT: "대중교통",
  WALK: "도보",
  CAR: "자동차",
};

const DESTINATION_IMAGES: Record<string, string> = {
  BUSAN_HAEUNDAE: "/trips-covers/destination-haeundae-cheongsapo.png",
  BUSAN_GWANGALLI: "/trips-covers/destination-gwangalli-millak.png",
  BUSAN_SONGJEONG: "/trips-covers/destination-songjeong-gijang.png",
  BUSAN_SEOMYEON: "/trips-covers/destination-seomyeon-jeonpo.png",
  BUSAN_YEONGDO: "/trips-covers/destination-yeongdo-huinnyeoul.png",
  BUSAN_NAMPO: "/trips-covers/destination-nampo-jagalchi.png",
  BUSAN_DADAEPO: "/trips-covers/destination-dadaepo.png",
  BUSAN_DONGNAE: "/trips-covers/destination-dongnae-oncheonjang.png",
};

function getDestinationImage(destination: Destination) {
  return DESTINATION_IMAGES[destination.destinationId] ?? "/trips-covers/header-busan.png";
}

function formatStayTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
  if (hours > 0) return `${hours}시간`;
  return `${minutes}분`;
}

function DestinationCard({
  destination,
  imageSrc,
  failure,
  selected,
  onSelect,
}: {
  destination: Destination;
  imageSrc: string;
  failure?: SpontaneousCourseFailure;
  selected: boolean;
  onSelect: () => void;
}) {
  const { transport } = destination;
  const failurePresentation = failure
    ? getSpontaneousCourseErrorPresentation(failure, transport.mode)
    : null;
  const isUnavailable = failurePresentation?.kind === "conditions";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={isUnavailable}
      onClick={onSelect}
      className={`group w-full rounded-[1.65rem] border-2 p-3 text-left transition-all duration-200 ${
        isUnavailable
          ? "cursor-not-allowed border-red-100 bg-red-50/60 opacity-75"
          : selected
            ? "cursor-pointer border-[#2f7ff2] bg-linear-to-br from-white to-[#f1f7ff] shadow-[0_10px_24px_rgba(47,127,242,0.13)]"
            : "cursor-pointer border-[#e6eaf0] bg-white shadow-[0_7px_18px_rgba(34,67,120,0.07)] hover:-translate-y-0.5 hover:border-[#9fc5fb] hover:shadow-[0_12px_24px_rgba(47,127,242,0.13)]"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative h-[7.8rem] w-[5.8rem] shrink-0 overflow-hidden rounded-[1.2rem] bg-[#edf4fb]">
          <Image
            src={imageSrc}
            alt={`${destination.name} 대표 이미지`}
            fill
            sizes="92px"
            quality={90}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[1.05rem] font-bold tracking-[-0.04em] text-[#0b1d43]">
                  {destination.name}
                </p>
                {!failurePresentation && (
                  <span className="shrink-0 rounded-full bg-[#eaf3ff] px-3 py-1 text-xs font-semibold text-[#2f7ff2]">
                    {TRANSPORT_LABEL[transport.mode]}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-[#8793a8]">
                {(destination.distanceMeters / 1000).toFixed(1)}km 거리
              </p>
            </div>

            <span
              aria-hidden="true"
              className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                selected
                  ? "border-[#2f7ff2] bg-white"
                  : "border-[#cbd3df] bg-white group-hover:border-[#8dbbff]"
              }`}
            >
              {selected && <span className="size-4 rounded-full bg-[#2f7ff2]" />}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div className="rounded-xl bg-white/80 px-1 py-2 text-center">
              <p className="whitespace-nowrap text-[0.68rem] text-[#8995aa]">가는 시간</p>
              <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-[#0b1d43]">
                {transport.outboundMinutes}분
              </p>
            </div>
            <div className="rounded-xl bg-white/80 px-1 py-2 text-center">
              <p className="whitespace-nowrap text-[0.68rem] text-[#8995aa]">오는 시간</p>
              <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-[#0b1d43]">
                {transport.returnMinutes}분
              </p>
            </div>
            <div className="rounded-xl bg-[#e5f8f4] px-1 py-2 text-center">
              <p className="whitespace-nowrap text-[0.68rem] text-[#12a98e]">여유 시간</p>
              <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-[#08a98c]">
                {formatStayTime(transport.availableStayMinutes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {failurePresentation && (
        <div className="mt-3 rounded-2xl bg-white/85 px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <p
              className={`text-sm font-semibold ${
                isUnavailable ? "text-red-700" : "text-amber-800"
              }`}
            >
              {failurePresentation.title}
            </p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                isUnavailable ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isUnavailable ? "현재 조건에서 불가" : "다시 시도 가능"}
            </span>
          </div>
          <p
            className={`mt-1 text-xs leading-relaxed ${
              isUnavailable ? "text-red-500" : "text-amber-700"
            }`}
          >
            {isUnavailable
              ? "다른 목적지 또는 여행 조건을 선택해 주세요."
              : "이 목적지를 선택하면 코스 생성을 다시 시도해요."}
          </p>
        </div>
      )}
    </button>
  );
}

export default function SpontaneousDestinationsPage() {
  const router = useRouter();
  const {
    draft,
    setSelectedDestinationId,
    setCourse,
    setCourseFailure,
    clearCourseFailure,
  } = useSpontaneousDraft();
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.startLocation) {
      router.replace("/spontaneous");
      return;
    }
    if (!draft.conditions || !draft.destinations) {
      router.replace("/spontaneous/conditions");
    }
  }, [draft, router]);

  const destinations = draft.destinations ?? [];
  const courseFailures = draft.courseFailures ?? {};
  const isUnavailable = (destination: Destination) => {
    const failure = courseFailures[destination.destinationId];
    return failure
      ? getSpontaneousCourseErrorPresentation(failure, destination.transport.mode).kind ===
          "conditions"
      : false;
  };
  const storedSelection = destinations.find(
    (destination) =>
      destination.destinationId === draft.selectedDestinationId && !isUnavailable(destination),
  );
  const defaultSelection = destinations.find((destination) => !isUnavailable(destination));
  const selectedDestinationId =
    pendingSelectionId ?? storedSelection?.destinationId ?? defaultSelection?.destinationId ?? null;
  const selectedDestination = destinations.find(
    (destination) => destination.destinationId === selectedDestinationId,
  );
  const hasUnavailableDestinations = destinations.some(isUnavailable);
  const heroDestinations = destinations.slice(0, 3);
  const remainingDestinationCount = Math.max(destinations.length - heroDestinations.length, 0);

  async function handleContinue() {
    if (!selectedDestination || !draft.startLocation || !draft.conditions) return;

    clearCourseFailure(selectedDestination.destinationId);
    setSelectedDestinationId(selectedDestination.destinationId);
    router.push("/spontaneous/generating");

    try {
      const course = await createCourse({
        destinationId: selectedDestination.destinationId,
        startLocation: {
          latitude: draft.startLocation.latitude,
          longitude: draft.startLocation.longitude,
        },
        ...draft.conditions,
      });
      setCourse(course);
      router.replace("/spontaneous/result");
    } catch (cause) {
      const failure: SpontaneousCourseFailure = {
        destinationId: selectedDestination.destinationId,
        destinationName: selectedDestination.name,
        code: cause instanceof ApiError ? cause.payload.code : "UNKNOWN_API_ERROR",
        message: cause instanceof ApiError ? cause.message : "코스를 만들지 못했습니다.",
      };
      setCourseFailure(failure);
      router.replace("/spontaneous/generating");
    }
  }

  return (
    <PageFade className="flex min-h-0 flex-1 flex-col bg-[#fcfdff]">
      <header className="relative shrink-0 px-14 pt-4 pb-3 text-center">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="absolute top-2.5 left-3 grid size-11 place-items-center rounded-full text-[#0d234f] transition-colors hover:bg-[#f1f6fc] active:bg-[#e8f1fa]"
        >
          <ChevronLeft size={34} strokeWidth={2.35} />
        </button>
        <h1 className="text-xl font-bold tracking-[-0.035em] text-[#0b1d43]">목적지 추천</h1>
        <p className="mt-1 text-sm font-medium text-[#8793a8]">가고 싶은 권역을 선택하세요</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
        {heroDestinations.length > 0 && (
          <section className="px-4 pt-1 pb-1.5">
            <div className="relative h-[10.75rem] overflow-hidden rounded-[1.7rem] border border-[#dcecff] bg-[#e9f7ff] shadow-[0_10px_28px_rgba(53,142,214,0.13)]">
              <Image
                src="/trips-covers/header-busan.png"
                alt=""
                fill
                priority
                sizes="(max-width: 512px) calc(100vw - 32px), 480px"
                quality={90}
                className="object-cover object-[66%_66%]"
              />
              <div className="absolute inset-0 bg-linear-to-r from-white/96 via-white/76 to-[#d8f4ff]/30" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-white/55 to-transparent" />

              <div className="relative z-10 flex h-full flex-col px-5 pt-4 pb-3.5">
                <span className="w-fit rounded-full bg-[#2f7ff2] px-3 py-1 text-[0.68rem] font-bold text-white shadow-[0_4px_10px_rgba(47,127,242,0.22)]">
                  현재 조건 기준
                </span>
                <h2 className="mt-2 text-[1.28rem] font-extrabold tracking-[-0.045em] text-[#0b2856]">
                  지금 갈 수 있는 부산 {destinations.length}곳
                </h2>
                <p className="mt-0.5 text-[0.76rem] font-medium tracking-[-0.025em] text-[#63799a]">
                  이동 시간과 여유 시간을 비교해 보세요
                </p>

                <div className="mt-auto flex items-center pl-1" aria-label="추천 목적지 미리보기">
                  {heroDestinations.map((destination, index) => (
                    <span
                      key={destination.destinationId}
                      title={destination.name}
                      className={`relative size-10 overflow-hidden rounded-full border-[3px] border-white bg-[#dceeff] shadow-[0_4px_11px_rgba(23,68,123,0.2)] ${
                        index > 0 ? "-ml-2.5" : ""
                      }`}
                    >
                      <Image
                        src={getDestinationImage(destination)}
                        alt=""
                        fill
                        sizes="40px"
                        quality={85}
                        className="object-cover"
                      />
                    </span>
                  ))}
                  {remainingDestinationCount > 0 && (
                    <span className="ml-2 text-sm font-bold text-[#48698f]">
                      +{remainingDestinationCount}곳
                    </span>
                  )}
                </div>
              </div>

              <span
                aria-hidden="true"
                className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full border-[5px] border-white/55 bg-white/88 text-[#2f7ff2] shadow-[0_7px_16px_rgba(47,127,242,0.18)] backdrop-blur-sm"
              >
                <Compass size={25} strokeWidth={2.25} />
              </span>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 px-4 pt-4 pb-6">
          {hasUnavailableDestinations && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800">
              현재 조건으로 만들 수 없는 목적지는 선택할 수 없게 표시했어요. 다른 목적지를
              고르거나 여행 조건을 변경해 주세요.
            </div>
          )}

          {destinations.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <p className="text-sm text-[#8793a8]">추천 가능한 목적지가 없습니다</p>
              <button
                type="button"
                onClick={() => router.back()}
                className="mt-3 rounded-full px-4 py-2 text-sm font-bold text-[#2f7ff2] transition-colors hover:bg-[#eff6ff]"
              >
                조건 다시 설정
              </button>
            </div>
          ) : (
            <div role="radiogroup" aria-label="추천 목적지" className="flex flex-col gap-3">
              {destinations.map((destination) => (
                <DestinationCard
                  key={destination.destinationId}
                  destination={destination}
                  imageSrc={getDestinationImage(destination)}
                  failure={courseFailures[destination.destinationId]}
                  selected={destination.destinationId === selectedDestinationId}
                  onSelect={() => setPendingSelectionId(destination.destinationId)}
                />
              ))}
            </div>
          )}

          {destinations.length > 0 && (
            <button
              type="button"
              disabled={!selectedDestination}
              onClick={handleContinue}
              className="mt-2 flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-linear-to-r from-[#2f7ff2] via-[#1aaee0] to-[#16c7b4] py-4 text-lg font-bold text-white shadow-[0_10px_24px_rgba(30,161,205,0.2)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(30,161,205,0.28)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              이 코스로 계속하기
              <ArrowRight size={25} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </PageFade>
  );
}
