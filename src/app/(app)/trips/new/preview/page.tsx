"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import { ApiError } from "@/lib/api/client";
import { getTripQuestions } from "@/lib/api/questions";
import { createSchedulePreview, getSchedulePreview } from "@/lib/api/schedule-previews";
import { useTripDraft } from "@/store/trip-draft";
import type { TripQuestion } from "@/types/api/question";
import type { CreateSchedulePreviewRequest, SchedulePreview } from "@/types/api/schedule-preview";

function previewRequestFromDraft(
  draft: ReturnType<typeof useTripDraft>["draft"],
): CreateSchedulePreviewRequest {
  return {
    startDate: draft.startDate,
    endDate: draft.endDate,
    startLocation: draft.startLocation,
    startTime: draft.startTime,
    lodgingPlan: draft.lodgingPlan,
    endConstraint: draft.endConstraint,
    selectedAnswers: draft.selectedAnswers,
    mustVisitPlaceIds: draft.mustVisitPlaceIds,
    fixedEvents: draft.fixedEvents,
    dayOverrides: draft.dayOverrides,
    customPrompt: draft.customPrompt,
  };
}

function locationLabel(name: string | undefined, source: string) {
  if (name) return name;
  return source === "PLANNER_DECIDES" ? "AI가 동선에 맞춰 결정" : "미정";
}

export default function TripPreviewPage() {
  const router = useRouter();
  const { draft, hydrated, setPreview } = useTripDraft();
  const [preview, setPreviewState] = useState<SchedulePreview | null>(null);
  const [questions, setQuestions] = useState<TripQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestedRef = useRef(false);

  const loadPreview = useCallback(
    async (preferExisting: boolean) => {
      setLoading(true);
      setError(null);
      try {
        let response: SchedulePreview;
        try {
          response =
            preferExisting && draft.previewId
              ? await getSchedulePreview(draft.previewId)
              : await createSchedulePreview(previewRequestFromDraft(draft));
        } catch (cause) {
          if (preferExisting && cause instanceof ApiError && cause.payload.code === "PREVIEW_EXPIRED") {
            response = await createSchedulePreview(previewRequestFromDraft(draft));
          } else {
            throw cause;
          }
        }
        setPreviewState(response);
        setPreview(response);
      } catch (cause) {
        if (cause instanceof ApiError && cause.payload.fieldErrors?.length) {
          setError(cause.payload.fieldErrors.map((item) => item.message).join(" "));
        } else {
          setError(cause instanceof Error ? cause.message : "입력 조건을 확인하지 못했습니다.");
        }
      } finally {
        setLoading(false);
      }
    },
    [draft, setPreview],
  );

  useEffect(() => {
    if (!hydrated || requestedRef.current) return;
    requestedRef.current = true;
    void loadPreview(true);
    void getTripQuestions()
      .then((response) => setQuestions(response.items))
      .catch(() => setQuestions([]));
  }, [hydrated, loadPreview]);

  const answerLabels = draft.selectedAnswers.flatMap((selected) => {
    const question = questions.find((item) => item.id === selected.questionId);
    return selected.answerIds.map(
      (answerId) => question?.answers.find((answer) => answer.id === answerId)?.label ?? answerId,
    );
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="일정 확인" />
      <div className="flex flex-1 flex-col gap-6 px-5 pb-6">
        <section>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">이대로 만들까요?</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">선택한 내용과 하루 활동 시간을 확인해 주세요</p>
        </section>

        {loading && (
          <div className="py-16 text-center">
            <div className="mx-auto size-9 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
            <p className="mt-4 text-sm text-zinc-500">입력한 조건을 확인하고 있어요.</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            <p>{error}</p>
            <button type="button" onClick={() => loadPreview(false)} className="mt-3 font-bold underline">다시 확인</button>
          </div>
        )}

        {preview && !loading && (
          <>
            <section className="border-y border-zinc-200 py-4">
              <dl className="grid gap-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">여행 일정</dt>
                  <dd className="text-right font-semibold">{draft.startDate} - {draft.endDate}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-zinc-400">시작 위치</dt>
                  <dd className="text-right font-semibold">{draft.startLocation?.name}</dd>
                </div>
                <div>
                  <dt className="text-zinc-400">여행 취향</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {answerLabels.map((label) => (
                      <span key={label} className="rounded-full bg-[#EAF2FE] px-3 py-1.5 text-xs font-medium text-[#2E7DF2]">{label}</span>
                    ))}
                  </dd>
                </div>
                {draft.selectedPlaces.length > 0 && (
                  <div>
                    <dt className="text-zinc-400">꼭 가고 싶은 곳</dt>
                    <dd className="mt-1 font-semibold">{draft.selectedPlaces.map((place) => place.name).join(", ")}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section>
              <h2 className="text-base font-bold">하루 활동 시간</h2>
              <ol className="mt-3 flex flex-col">
                {preview.resolvedDays.map((day, index) => (
                  <li key={day.date} className="flex gap-3 border-b border-zinc-100 py-3 first:pt-0">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{day.date}</p>
                        <p className="text-sm font-bold text-[#2E7DF2]">{day.availableFrom} - {day.availableUntil}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-400">
                        {locationLabel(day.startLocation?.name, day.startLocationSource)} → {locationLabel(day.endLocation?.name, day.endLocationSource)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              {preview.appliedDefaults.length > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">입력하지 않은 시간과 위치는 여행 일정에 맞춰 자동으로 정했습니다.</p>
              )}
            </section>

            {preview.routeCoverage === "ATTRACTION_ROUTES_ONLY" && (
              <p className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">숙소가 정해지지 않아 방문지 사이의 이동시간을 기준으로 일정을 만듭니다.</p>
            )}

            {preview.warnings
              .filter(
                (warning) =>
                  preview.routeCoverage !== "ATTRACTION_ROUTES_ONLY" ||
                  warning.code !== "LODGING_ROUTE_EXCLUDED",
              )
              .map((warning) => (
              <p key={`${warning.code}-${warning.date ?? "all"}`} className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{warning.message}</p>
              ))}

            {preview.conflicts.length > 0 && (
              <section className="rounded-xl bg-red-50 p-4">
                <h2 className="text-sm font-bold text-red-700">시간을 다시 확인해 주세요</h2>
                <ul className="mt-2 flex flex-col gap-2 text-sm text-red-600">
                  {preview.conflicts.map((conflict, index) => (
                    <li key={`${conflict.code}-${index}`}>{conflict.message}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => router.push("/trips/new/date")} className="mt-3 text-sm font-bold text-red-700 underline">날짜와 시작 위치 수정</button>
              </section>
            )}

            <button
              type="button"
              disabled={!preview.canGenerate}
              onClick={() => router.push("/trips/new/generating")}
              className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 font-medium text-white disabled:opacity-40"
            >
              일정 만들기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
