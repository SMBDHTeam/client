"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/axios";
import { getSchedulePreview } from "@/lib/api/schedule-previews";
import { createSchedule } from "@/lib/api/schedules";
import { useTripDraft } from "@/store/trip-draft";

export default function TripGeneratingPage() {
  const router = useRouter();
  const { draft, hydrated, setIdempotencyKey, resetDraft } = useTripDraft();
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(true);
  const startedRef = useRef(false);

  const generate = useCallback(async () => {
    if (!draft.previewId) {
      router.replace("/trips/new/preview");
      return;
    }

    setError(null);
    setRetryable(true);
    const key = draft.idempotencyKey ?? crypto.randomUUID();
    if (!draft.idempotencyKey) setIdempotencyKey(key);

    try {
      const preview = await getSchedulePreview(draft.previewId);
      if (!preview.canGenerate) {
        router.replace("/trips/new/preview");
        return;
      }
      const schedule = await createSchedule(preview, key, draft.selectedPlaces);
      resetDraft();
      router.replace(`/trips/${schedule.id}`);
    } catch (cause) {
      if (cause instanceof ApiError && cause.payload.code === "PREVIEW_ALREADY_CONSUMED" && cause.payload.scheduleId) {
        resetDraft();
        router.replace(`/trips/${cause.payload.scheduleId}`);
        return;
      }
      if (cause instanceof ApiError && cause.status !== 503) setRetryable(false);
      setError(cause instanceof Error ? cause.message : "일정을 생성하지 못했습니다.");
    }
  }, [draft, resetDraft, router, setIdempotencyKey]);

  useEffect(() => {
    if (!hydrated || startedRef.current) return;
    startedRef.current = true;
    void generate();
  }, [generate, hydrated]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      {!error ? (
        <>
          <div className="size-16 animate-spin rounded-full border-[6px] border-zinc-200 border-t-[#2E7DF2]" />
          <h1 className="mt-7 text-xl font-bold">이동시간과 방문 순서를 계산하고 있어요</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">선택한 취향과 장소를 반영해 가장 자연스러운 동선을 만들어요.</p>
        </>
      ) : (
        <div className="mt-6 w-full rounded-xl bg-red-50 p-4 text-sm text-red-600">
          <p>{error}</p>
          {retryable ? (
            <button type="button" onClick={generate} className="mt-3 font-bold underline">같은 요청으로 재시도</button>
          ) : (
            <button type="button" onClick={() => router.replace("/trips/new/date")} className="mt-3 font-bold underline">입력 내용 수정</button>
          )}
        </div>
      )}
    </div>
  );
}
