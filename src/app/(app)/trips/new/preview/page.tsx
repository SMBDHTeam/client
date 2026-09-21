"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { ApiError } from "@/lib/api/axios";
import { getTripQuestions } from "@/lib/api/questions";
import { createSchedulePreview, getSchedulePreview } from "@/lib/api/schedule-previews";
import { useTripDraft } from "@/store/trip-draft";
import type { TripQuestion } from "@/types/api/question";
import type { CreateSchedulePreviewRequest, SchedulePreview, TripDraftState } from "@/types/api/schedule-preview";

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

function timeInputValue(value: string) {
  return value.slice(0, 5);
}

function timeApiValue(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

export default function TripPreviewPage() {
  const router = useRouter();
  const { draft, hydrated, updateDraft, setPreview } = useTripDraft();
  const [preview, setPreviewState] = useState<SchedulePreview | null>(null);
  const [questions, setQuestions] = useState<TripQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [timeForm, setTimeForm] = useState({ availableFrom: "10:00", availableUntil: "20:00" });
  const requestedRef = useRef(false);

  const loadPreview = useCallback(
    async (preferExisting: boolean, nextDraft: TripDraftState = draft) => {
      setLoading(true);
      setError(null);
      try {
        let response: SchedulePreview;
        try {
          response =
            preferExisting && nextDraft.previewId
              ? await getSchedulePreview(nextDraft.previewId)
              : await createSchedulePreview(previewRequestFromDraft(nextDraft));
        } catch (cause) {
          if (preferExisting && cause instanceof ApiError && cause.payload.code === "PREVIEW_EXPIRED") {
            response = await createSchedulePreview(previewRequestFromDraft(nextDraft));
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

  function openTimeEditor(day: SchedulePreview["resolvedDays"][number]) {
    setEditingDate(day.date);
    setTimeForm({
      availableFrom: timeInputValue(day.availableFrom),
      availableUntil: timeInputValue(day.availableUntil),
    });
  }

  function applyTimeOverride(date: string) {
    if (timeForm.availableFrom >= timeForm.availableUntil) {
      setError("활동 시작 시간은 종료 시간보다 빨라야 합니다.");
      return;
    }

    const dayOverrides = [
      ...draft.dayOverrides.filter((override) => override.date !== date),
      {
        date,
        availableFrom: timeApiValue(timeForm.availableFrom),
        availableUntil: timeApiValue(timeForm.availableUntil),
      },
    ].sort((left, right) => left.date.localeCompare(right.date));
    const nextDraft = { ...draft, dayOverrides };

    setEditingDate(null);
    updateDraft({ dayOverrides });
    void loadPreview(false, nextDraft);
  }

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
                {draft.lodgingPlan.mode === "FIXED_BASE" && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-zinc-400">숙소·도착지</dt>
                    <dd className="text-right font-semibold">{draft.lodgingPlan.baseLocation.name}</dd>
                  </div>
                )}
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
                  <li key={day.date} className="border-b border-zinc-100 py-3 first:pt-0">
                    <button
                      type="button"
                      onClick={() => openTimeEditor(day)}
                      className="flex w-full gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-[#f6f9ff] active:bg-[#eef5ff]"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{day.date}</p>
                            <p className="mt-1 truncate text-xs text-zinc-400">
                              {locationLabel(day.startLocation?.name, day.startLocationSource)} → {locationLabel(day.endLocation?.name, day.endLocationSource)}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-[#2E7DF2]">{day.availableFrom} - {day.availableUntil}</p>
                            <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-[#EAF2FE] px-2 py-0.5 text-[0.65rem] font-bold text-[#2E7DF2]">
                              시간 수정
                              <ChevronDown size={12} className={editingDate === day.date ? "rotate-180 transition-transform" : "transition-transform"} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                    {editingDate === day.date && (
                      <div className="mt-3 rounded-2xl bg-[#f6f9ff] p-3">
                        <p className="text-xs font-semibold text-zinc-500">활동 시간 수정</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <label className="text-xs text-zinc-500">
                            시작
                            <input
                              type="time"
                              value={timeForm.availableFrom}
                              onChange={(event) =>
                                setTimeForm((current) => ({ ...current, availableFrom: event.target.value }))
                              }
                              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800"
                            />
                          </label>
                          <label className="text-xs text-zinc-500">
                            종료
                            <input
                              type="time"
                              value={timeForm.availableUntil}
                              onChange={(event) =>
                                setTimeForm((current) => ({ ...current, availableUntil: event.target.value }))
                              }
                              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800"
                            />
                          </label>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingDate(null)}
                            className="flex-1 rounded-full bg-white py-2 text-xs font-bold text-zinc-500"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTimeOverride(day.date)}
                            className="flex-1 rounded-full bg-[#2E7DF2] py-2 text-xs font-bold text-white"
                          >
                            적용
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              {preview.appliedDefaults.length > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-zinc-400">날짜별 활동 시간은 기본값으로 설정되며, 각 날짜를 눌러 수정할 수 있습니다.</p>
              )}
            </section>

            {preview.routeCoverage === "ATTRACTION_ROUTES_ONLY" && (
              <p className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
                숙소·도착지를 별도로 입력하지 않아 출발지를 기준으로 하루를 마무리합니다. 방문지 사이의 이동시간을 우선 고려해 일정을 만듭니다.
              </p>
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
