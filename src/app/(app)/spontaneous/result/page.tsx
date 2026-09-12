"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">{course.name}</h1>
          <p className="text-xs text-zinc-400">
            {course.startLocation?.name || draft.startLocation?.name || "선택한 출발지"}에서 출발
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetDraft();
            router.replace("/spontaneous");
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-zinc-500 hover:bg-black/5"
        >
          새로
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-6">
        <ScheduleCourseView
          places={places}
          routeLines={course.routeLines ?? []}
          startMarker={startMarker}
          finalTransit={course.finalTransit ?? null}
          finalTransitTitle="출발지로 복귀"
          returnSummary={returnSummary}
          returnArrivalLabel={returnArrivalLabel}
          publicTransitOnly
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
          className="w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "저장 중..." : "이 일정 저장"}
        </button>
      </div>
    </div>
  );
}
