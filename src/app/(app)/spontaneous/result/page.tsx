"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, RotateCw } from "lucide-react";
import ScheduleCourseView, {
  type ScheduleCourseMarker,
  type ScheduleCoursePlace,
} from "@/components/trip/ScheduleCourseView";
import { saveSpontaneousSchedule } from "@/lib/api/spontaneous-trips";
import { ApiError } from "@/lib/api/axios";
import {
  formatCourseTime,
  formatKoreanReturnTime,
  resolveSaveIdempotencyKey,
} from "@/lib/schedule-course";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";

const ROLE_LABEL: Record<string, string> = {
  ACTIVITY: "관광",
  MEAL: "식사",
  CAFE: "카페",
  NIGHT_VIEW: "야경",
};

function finiteCoordinate(value: number | null | undefined) {
  return value != null && Number.isFinite(value) ? value : null;
}

function saveErrorMessage(cause: unknown) {
  if (!(cause instanceof ApiError)) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요. 같은 저장 요청으로 안전하게 재시도됩니다.";
  }

  const serverMessage = cause.payload.message?.trim();
  const message = serverMessage || "일정을 저장하지 못했습니다.";
  switch (cause.payload.code) {
    case "SCHEDULE_CREATION_IN_PROGRESS":
      return message + " 잠시 후 같은 저장 요청으로 다시 시도해 주세요.";
    case "SPONTANEOUS_PREVIEW_EXPIRED":
    case "SPONTANEOUS_PREVIEW_INVALID":
      return message + " 새로 시작해 코스를 다시 만들어 주세요.";
    case "SPONTANEOUS_PLACE_HIDDEN":
      return message + " 새로 시작해 다른 코스를 만들어 주세요.";
    case "SPONTANEOUS_PREVIEW_OWNER_MISMATCH":
      return message + " 로그인한 사용자가 코스를 만든 사용자와 같은지 확인해 주세요.";
    case "IDEMPOTENCY_KEY_REUSED":
      return message + " 현재 저장 요청의 상태를 확인해 주세요.";
    default:
      return cause.status >= 500
        ? message + " 잠시 후 같은 저장 요청으로 다시 시도해 주세요."
        : message;
  }
}

export default function SpontaneousResultPage() {
  const router = useRouter();
  const {
    draft,
    hydrated,
    setSaveIdempotencyKey,
    resetDraft,
  } = useSpontaneousDraft();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !draft.course) {
      router.replace("/spontaneous");
    }
  }, [draft.course, hydrated, router]);

  const course = draft.course;
  const places = useMemo<ScheduleCoursePlace[]>(
    () =>
      course?.course.map((item, index) => {
        const latitude =
          finiteCoordinate(item.place?.latitude) ?? finiteCoordinate(item.latitude);
        const longitude =
          finiteCoordinate(item.place?.longitude) ?? finiteCoordinate(item.longitude);
        return {
          id: "preview-" + item.order + "-" + (item.contentId ?? index),
          placeId: item.place?.id ?? null,
          order: item.order,
          latitude,
          longitude,
          imageUrl: item.place?.primaryImageUrl ?? null,
          arrivalTime: formatCourseTime(item.arrivalAt),
          title: item.place?.name || item.name,
          categoryLabel:
            item.place?.categoryLabel?.trim() ||
            ROLE_LABEL[item.role] ||
            null,
          stayMinutes: item.stayMinutes,
          inboundTransit: item.inboundTransit,
          warnings: [],
        };
      }) ?? [],
    [course],
  );

  const startMarker = useMemo<ScheduleCourseMarker | null>(() => {
    const latitude =
      finiteCoordinate(course?.startLocation?.latitude) ??
      finiteCoordinate(draft.startLocation?.latitude);
    const longitude =
      finiteCoordinate(course?.startLocation?.longitude) ??
      finiteCoordinate(draft.startLocation?.longitude);
    if (latitude == null || longitude == null) return null;
    return {
      name: course?.startLocation?.name || draft.startLocation?.name || "출발지",
      latitude,
      longitude,
    };
  }, [course?.startLocation, draft.startLocation]);

  async function handleSave() {
    if (saving || !course) return;
    if (!course.previewId || !course.previewToken) {
      setSaveError("저장 가능한 미리보기 정보가 없습니다. 새로 시작해 코스를 다시 만들어 주세요.");
      return;
    }

    const idempotencyKey = resolveSaveIdempotencyKey(draft.saveIdempotencyKey);
    if (!draft.saveIdempotencyKey) {
      setSaveIdempotencyKey(idempotencyKey);
    }

    setSaving(true);
    setSaveError(null);
    try {
      const savedSchedule = await saveSpontaneousSchedule(
        {
          previewId: course.previewId,
          previewToken: course.previewToken,
        },
        idempotencyKey,
      );
      resetDraft();
      router.replace("/trips/" + savedSchedule.id);
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        cause.payload.code === "SPONTANEOUS_PREVIEW_ALREADY_SAVED" &&
        cause.payload.scheduleId
      ) {
        const scheduleId = cause.payload.scheduleId;
        resetDraft();
        router.replace("/trips/" + scheduleId);
        return;
      }
      setSaveError(saveErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated || !course) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
      </div>
    );
  }

  const returnArrivalLabel = formatKoreanReturnTime(
    course.estimatedReturnAt,
    course.startAt,
  );
  const returnSummary =
    course.returnTravelMinutes != null
      ? "마지막 장소에서 " + course.returnTravelMinutes + "분 이동"
      : null;
  const canSave = Boolean(course.previewId && course.previewToken);

  return (
    <div className="flex flex-1 flex-col bg-[#fbfdff]">
      <header className="relative shrink-0 overflow-hidden border-b border-[#edf4fb] px-24 pt-4 pb-4 text-center">
        <Image
          src="/trips-covers/header-busan.png"
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 512px"
          className="pointer-events-none object-cover object-[72%_65%] opacity-55"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white via-white/82 to-white/48" />
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="absolute top-2.5 left-3 z-10 grid size-11 place-items-center rounded-full text-[#0d234f] transition-colors hover:bg-white/75 active:bg-white"
        >
          <ChevronLeft size={34} strokeWidth={2.35} />
        </button>
        <div className="relative z-10 min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-[-0.045em] text-[#0b2146]">
            {course.name}
          </h1>
          <p className="mt-1 truncate text-xs font-medium text-[#708199]">
            {course.startLocation?.name || draft.startLocation?.name || "선택한 출발지"}에서 출발
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetDraft();
            router.replace("/spontaneous");
          }}
          className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full px-2.5 py-2 text-xs font-bold text-[#2f7ff2] transition-colors hover:bg-white/75 active:bg-white"
        >
          새로 추천
          <RotateCw size={18} strokeWidth={2.35} />
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-3 pb-6 scrollbar-none">
        <ScheduleCourseView
          places={places}
          routeLines={course.routeLines ?? []}
          startMarker={startMarker}
          finalTransit={course.finalTransit ?? null}
          finalTransitTitle="출발지로 복귀"
          returnSummary={returnSummary}
          returnArrivalLabel={returnArrivalLabel}
          imageUnavailableLabel="대표 이미지 준비 중"
          showSpontaneousRoadGuidance
          appearance="spontaneous-result"
        />

        {saveError && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
            {saveError}
          </p>
        )}
        {!canSave && !saveError && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            이 코스는 이전 형식의 미리보기라 저장할 수 없습니다. 새로 시작해 코스를 다시 만들어 주세요.
          </p>
        )}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !canSave}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#2f7ff2] via-[#1eabe0] to-[#17c6b2] py-4 text-center text-lg font-bold text-white shadow-[0_12px_26px_rgba(35,151,207,0.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(35,151,207,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <CalendarDays size={22} strokeWidth={2.2} />
          {saving ? "저장 중..." : "이 일정 저장"}
        </button>
      </div>
    </div>
  );
}
