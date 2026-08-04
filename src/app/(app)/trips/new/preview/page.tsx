"use client";

import { useEffect, useState } from "react";
import AppHeader from "@/components/navigation/AppHeader";
import GeneratingOverlay from "@/components/trip/GeneratingOverlay";
import PageFade from "@/components/ui/PageFade";
import { getTripQuestions } from "@/lib/api";
import type { TripQuestion } from "@/types/api";
import { readDraft, type TripDraft } from "@/store/tripDraft";
import { useCreateSchedule } from "@/hooks/useCreateSchedule";

const EMPTY_DRAFT: TripDraft = { answers: {}, mustVisitPlaces: [] };

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return "-";
  const format = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };
  return startDate === endDate
    ? format(startDate)
    : `${format(startDate)} - ${format(endDate)}`;
}

export default function TripPreviewPage() {
  const { create, creating, error } = useCreateSchedule();
  const [draft, setDraft] = useState<TripDraft>(EMPTY_DRAFT);
  const [questions, setQuestions] = useState<TripQuestion[]>([]);

  useEffect(() => {
    queueMicrotask(() => setDraft(readDraft()));
    getTripQuestions()
      .then((data) => setQuestions(data.items))
      .catch(() => setQuestions([]));
  }, []);

  const answerLabels = Object.entries(draft.answers)
    .flatMap(([questionId, answerId]) => {
      const question = questions.find((q) => q.id === questionId);
      const ids = Array.isArray(answerId) ? answerId : [answerId];
      return ids.map((id) => question?.answers.find((a) => a.id === id)?.label);
    })
    .filter((label): label is string => Boolean(label));

  return (
    <PageFade className="flex flex-1 flex-col">
      {creating && <GeneratingOverlay />}
      <AppHeader title="일정 확인" />

      <div className="flex flex-1 flex-col gap-6 px-5 pb-6">
        <section>
          <h1 className="text-2xl font-bold">이대로 만들까요?</h1>
          <p className="mt-1 text-sm text-zinc-500">
            선택한 내용을 확인해 주세요
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">여행 일정</span>
            <span className="font-semibold">
              {formatDateRange(draft.startDate, draft.endDate)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">활동 시간</span>
            <span className="font-semibold">
              {draft.dailyStartTime ?? "-"} - {draft.dailyEndTime ?? "-"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">출발지</span>
            <span className="font-semibold">
              {draft.startLocation?.name ?? "-"}
            </span>
          </div>

          {answerLabels.length > 0 && (
            <div>
              <span className="text-zinc-400">여행 취향</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {answerLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-[#EAF2FE] px-3 py-1.5 text-xs font-medium text-[#2E7DF2]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {draft.mustVisitPlaces.length > 0 && (
            <div>
              <span className="text-zinc-400">꼭 가고 싶은 곳</span>
              <p className="mt-1 font-semibold">
                {draft.mustVisitPlaces.map((p) => p.name).join(", ")}
              </p>
            </div>
          )}
        </section>

        {error && (
          <p className="text-center text-sm text-[#F16E5E]">{error}</p>
        )}

        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
        >
          이대로 일정 만들기
        </button>
      </div>
    </PageFade>
  );
}
