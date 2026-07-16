"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTripQuestions } from "@/lib/api/questions";
import { useTripDraft } from "@/store/trip-draft";
import type { TripQuestion } from "@/types/api/question";
import QuestionField from "./QuestionField";
import StepProgress from "./StepProgress";

export default function QuestionStepPage({
  step,
  nextHref,
  title = "여행 취향을 알려주세요",
  subtitle = "하나씩 가볍게 선택해 주세요",
  layout = "grid",
  centered = false,
  buttonLabel = "다음",
}: {
  step: number;
  nextHref: string;
  title?: string;
  subtitle?: string;
  layout?: "grid" | "chips";
  centered?: boolean;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const { draft, setAnswer } = useTripDraft();
  const [questions, setQuestions] = useState<TripQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTripQuestions()
      .then((response) => {
        if (!cancelled) {
          setQuestions(response.items.toSorted((a, b) => a.displayOrder - b.displayOrder));
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "질문을 불러오지 못했습니다.");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleQuestions = useMemo(
    () => questions.filter((question) => question.uiStep === step),
    [questions, step],
  );

  const valid =
    visibleQuestions.length > 0 &&
    visibleQuestions.every((question) => {
      const count =
        draft.selectedAnswers.find((answer) => answer.questionId === question.id)?.answerIds.length ?? 0;
      return count >= question.minSelections && count <= question.maxSelections;
    });

  return (
    <div className="flex flex-1 flex-col">
      <StepProgress step={step} total={3} />
      <div className="flex flex-1 flex-col gap-7 px-5 pt-6 pb-6">
        <section className={centered ? "text-center" : undefined}>
          {centered && (
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-linear-to-br from-[#8B7DF2] to-[#5B5EE8] text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 3l1.8 4.9L19 9.5l-4.9 1.8L12 16l-1.8-4.7L5 9.5l5.2-1.6L12 3Z" fill="currentColor" />
              </svg>
            </div>
          )}
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
        </section>

        {loading && <p className="text-sm text-zinc-400">질문을 불러오는 중...</p>}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        {visibleQuestions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            selectedIds={
              draft.selectedAnswers.find((answer) => answer.questionId === question.id)?.answerIds ?? []
            }
            onChange={(answerIds) => setAnswer(question.id, answerIds)}
            layout={layout}
          />
        ))}

        <button
          type="button"
          disabled={!valid || loading || Boolean(error)}
          onClick={() => router.push(nextHref)}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 font-medium text-white disabled:opacity-40"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
