"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Coffee,
  Feather,
  MapPinned,
  Rocket,
  Shuffle,
  Sparkles,
  Users,
  Zap,
  Route as RouteIcon,
  type LucideIcon,
} from "lucide-react";
import PageFade from "@/components/ui/PageFade";
import StepProgress from "@/components/StepProgress";
import { getTripQuestions } from "@/lib/api/questions";
import { useTripDraft } from "@/store/trip-draft";
import type { TripQuestion, TripQuestionAnswer } from "@/types/api/question";

const VIBE_ICONS: LucideIcon[] = [
  Zap,
  Feather,
  Rocket,
  Clock3,
  MapPinned,
  Shuffle,
  Users,
  Coffee,
  Sparkles,
  RouteIcon,
];

function vibeIcon(text: string): LucideIcon {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return VIBE_ICONS[h % VIBE_ICONS.length];
}

function AnswerGroup({
  answers,
  multiple,
  max,
  selectedIds,
  onToggle,
}: {
  answers: TripQuestionAnswer[];
  multiple: boolean;
  max: number;
  selectedIds: string[];
  onToggle: (answerId: string) => void;
}) {
  const sorted = answers.slice().sort((a, b) => a.displayOrder - b.displayOrder);

  if (!multiple && sorted.length === 2) {
    const selectedIndex = sorted.findIndex((a) => selectedIds.includes(a.id));
    return (
      <div className="relative flex rounded-full bg-zinc-100 p-1">
        <div
          className="absolute top-1 bottom-1 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] shadow-sm transition-transform duration-300 ease-out"
          style={{
            width: "calc(50% - 4px)",
            transform:
              selectedIndex === 1 ? "translateX(calc(100% + 4px))" : "translateX(0)",
            opacity: selectedIndex === -1 ? 0 : 1,
          }}
        />
        {sorted.map((a) => {
          const on = selectedIds.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onToggle(a.id)}
              className={`relative z-10 flex-1 rounded-full px-3 py-2.5 text-center text-sm font-semibold transition-colors ${
                on ? "text-white" : "text-zinc-500"
              }`}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {sorted.map((a) => {
        const Icon = vibeIcon(a.label);
        const on = selectedIds.includes(a.id);
        const atMax = multiple && !on && selectedIds.length >= max;
        return (
          <button
            key={a.id}
            type="button"
            disabled={atMax}
            onClick={() => onToggle(a.id)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center text-xs font-semibold transition-all ${
              on
                ? "border-transparent bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white shadow-sm"
                : atMax
                  ? "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300"
                  : "border-zinc-200 bg-white text-zinc-600"
            }`}
          >
            <Icon size={16} />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

export default function QuestionStep({
  uiStep,
  stepIndex,
  total,
  headerTitle,
  title,
  subtitle,
  nextHref,
  buttonLabel = "다음",
}: {
  uiStep: 1 | 2 | 3;
  stepIndex: number;
  total: number;
  headerTitle: string;
  title: string;
  subtitle?: string;
  nextHref: string;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const { draft, setAnswer } = useTripDraft();
  const [questions, setQuestions] = useState<TripQuestion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTripQuestions()
      .then((data) => {
        if (cancelled) return;
        setQuestions(
          data.items
            .filter((q) => q.uiStep === uiStep)
            .sort((a, b) => a.displayOrder - b.displayOrder),
        );
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [uiStep]);

  function selectedIdsFor(q: TripQuestion): string[] {
    return draft.selectedAnswers.find((a) => a.questionId === q.id)?.answerIds ?? [];
  }

  const stepQuestions = questions ?? [];
  const ready =
    stepQuestions.length > 0 &&
    stepQuestions.every(
      (q) => !q.required || selectedIdsFor(q).length >= q.minSelections,
    );

  function toggle(q: TripQuestion, answerId: string) {
    const multiple = q.type === "MULTIPLE_CHOICE";
    const current = selectedIdsFor(q);

    if (!multiple) {
      setAnswer(q.id, [answerId]);
      return;
    }
    if (current.includes(answerId)) {
      setAnswer(q.id, current.filter((id) => id !== answerId));
      return;
    }
    if (current.length >= q.maxSelections) return;
    setAnswer(q.id, [...current, answerId]);
  }

  function handleNext() {
    if (!ready) return;
    router.push(nextHref);
  }

  return (
    <PageFade className="flex flex-1 flex-col">
      <StepProgress step={stepIndex} total={total} title={headerTitle} />

      <div className="flex flex-1 flex-col gap-8 px-5 pt-6 pb-6">
        <section>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
        </section>

        {error && (
          <p className="text-sm text-[#F16E5E]">
            질문을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!error && questions === null && (
          <p className="text-sm text-zinc-400">불러오는 중...</p>
        )}

        {stepQuestions.map((q) => {
          const multiple = q.type === "MULTIPLE_CHOICE";
          const selectedIds = selectedIdsFor(q);
          return (
            <section key={q.id} className="flex flex-col gap-3">
              <div>
                <h2 className="text-base font-semibold">{q.text}</h2>
                {multiple && (
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {q.minSelections}~{q.maxSelections}개 선택 가능 ·{" "}
                    <span
                      className={
                        selectedIds.length > 0 ? "font-semibold text-[#2E7DF2]" : ""
                      }
                    >
                      {selectedIds.length}/{q.maxSelections}
                    </span>
                  </p>
                )}
              </div>
              <AnswerGroup
                answers={q.answers}
                multiple={multiple}
                max={q.maxSelections}
                selectedIds={selectedIds}
                onToggle={(answerId) => toggle(q, answerId)}
              />
            </section>
          );
        })}

        <button
          type="button"
          disabled={!ready}
          onClick={handleNext}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
        >
          {buttonLabel}
        </button>
      </div>
    </PageFade>
  );
}
