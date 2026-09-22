"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Armchair,
  Baby,
  CalendarDays,
  Coffee,
  Ellipsis,
  Gauge,
  Heart,
  Landmark,
  Mountain,
  PersonStanding,
  ShoppingBag,
  TrainFront,
  UserRound,
  UsersRound,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";
import PageFade from "@/components/ui/PageFade";
import StepProgress from "@/components/ui/StepProgress";
import { getTripQuestions } from "@/lib/api/questions";
import { useTripDraft } from "@/store/trip-draft";
import type { TripQuestion, TripQuestionAnswer } from "@/types/api/question";

function answerIcon(label: string): LucideIcon {
  if (label.includes("혼자")) return UserRound;
  if (label.includes("친구")) return UsersRound;
  if (label.includes("배우자") || label.includes("연인")) return Heart;
  if (label.includes("아이")) return Baby;
  if (label.includes("부모")) return PersonStanding;
  if (label.includes("빼곡") || label.includes("알찬")) return CalendarDays;
  if (label.includes("여유") || label.includes("널널")) return Armchair;
  if (label.includes("환승")) return TrainFront;
  if (label.includes("빠른")) return Gauge;
  if (label.includes("맛집") || label.includes("음식")) return Utensils;
  if (label.includes("자연")) return Mountain;
  if (label.includes("문화") || label.includes("역사")) return Landmark;
  if (label.includes("바다")) return Waves;
  if (label.includes("체험") || label.includes("액티")) return Activity;
  if (label.includes("쇼핑")) return ShoppingBag;
  if (label.includes("휴식") || label.includes("힐링")) return Coffee;
  return Ellipsis;
}

function answerDescription(label: string) {
  if (label.includes("빼곡") || label.includes("알찬")) return "많은 장소를 둘러봐요";
  if (label.includes("여유") || label.includes("널널")) return "머무는 시간을 넉넉하게 잡아요";
  if (label.includes("환승")) return "환승 횟수를 줄여요";
  if (label.includes("빠른")) return "도착 시간을 우선해요";
  return null;
}

function AnswerGroup({
  uiStep,
  answers,
  multiple,
  max,
  selectedIds,
  onToggle,
}: {
  uiStep: 1 | 2 | 3;
  answers: TripQuestionAnswer[];
  multiple: boolean;
  max: number;
  selectedIds: string[];
  onToggle: (answerId: string) => void;
}) {
  const sorted = answers.slice().sort((a, b) => a.displayOrder - b.displayOrder);

  if (uiStep === 1 && !multiple && sorted.length === 2) {
    return (
      <div className="flex rounded-full border border-[#d7e1ee] bg-white p-1 shadow-[0_5px_16px_rgba(40,76,121,0.04)]">
        {sorted.map((a) => {
          const on = selectedIds.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onToggle(a.id)}
              className={`flex-1 rounded-full px-3 py-3 text-center text-sm font-bold transition-all ${
                on ? "bg-[#e9f3ff] text-[#2376e9]" : "text-[#536681] hover:bg-[#f6f9fc]"
              }`}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (uiStep === 2) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {sorted.map((answer) => {
          const Icon = answerIcon(answer.label);
          const on = selectedIds.includes(answer.id);
          const description = answerDescription(answer.label);
          return (
            <button
              key={answer.id}
              type="button"
              onClick={() => onToggle(answer.id)}
              className={`relative flex min-h-[8.25rem] flex-col items-start justify-center rounded-[1.35rem] border px-5 py-5 text-left transition-all ${
                on
                  ? "border-2 border-[#2f7ff2] bg-[#edf6ff] text-[#174e9b] shadow-[0_9px_22px_rgba(47,127,242,0.09)]"
                  : "border-[#d7e0ec] bg-white text-[#14294d] hover:border-[#a9cafa]"
              }`}
            >
              <span
                className={`absolute top-4 right-4 grid size-6 place-items-center rounded-full border-2 ${
                  on ? "border-[#2f7ff2]" : "border-[#aab6c8]"
                }`}
              >
                {on && <span className="size-3.5 rounded-full bg-[#2f7ff2]" />}
              </span>
              <Icon size={38} strokeWidth={1.8} aria-hidden />
              <span className="mt-4 text-[1.02rem] font-extrabold tracking-[-0.035em]">
                {answer.label}
              </span>
              {description && (
                <span className="mt-1 text-sm font-medium text-[#7c899d]">{description}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (uiStep === 3) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {sorted.map((answer) => {
          const Icon = answerIcon(answer.label);
          const on = selectedIds.includes(answer.id);
          const atMax = multiple && !on && selectedIds.length >= max;
          return (
            <button
              key={answer.id}
              type="button"
              disabled={atMax}
              onClick={() => onToggle(answer.id)}
              className={`flex min-h-[6.7rem] flex-col items-center justify-center rounded-[1.25rem] border text-center transition-all ${
                on
                  ? "border-2 border-[#2f7ff2] bg-[#edf6ff] text-[#2376e9] shadow-[0_8px_20px_rgba(47,127,242,0.08)]"
                  : atMax
                    ? "cursor-not-allowed border-[#e6eaf0] bg-[#fafbfc] text-[#c5ccd7]"
                    : "border-[#d7e0ec] bg-white text-[#718099] hover:border-[#a9cafa]"
              }`}
            >
              <Icon size={37} strokeWidth={1.8} aria-hidden />
              <span className="mt-2.5 text-base font-extrabold tracking-[-0.03em] text-[#14294d]">
                {answer.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {sorted.map((a) => {
        const Icon = answerIcon(a.label);
        const on = selectedIds.includes(a.id);
        const atMax = multiple && !on && selectedIds.length >= max;
        return (
          <button
            key={a.id}
            type="button"
            disabled={atMax}
            onClick={() => onToggle(a.id)}
            className={`flex min-h-[6.25rem] flex-col items-center justify-center gap-2.5 rounded-[1.2rem] border p-3 text-center text-sm font-bold transition-all ${
              on
                ? "border-2 border-[#2f7ff2] bg-[#edf6ff] text-[#2376e9] shadow-[0_8px_18px_rgba(47,127,242,0.08)]"
                : atMax
                  ? "cursor-not-allowed border-[#e6eaf0] bg-[#fafbfc] text-[#c5ccd7]"
                  : "border-[#d7e0ec] bg-white text-[#14294d] hover:border-[#a9cafa]"
            }`}
          >
            <Icon size={32} strokeWidth={1.8} aria-hidden />
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
    <PageFade className="flex min-h-0 flex-1 flex-col bg-[#fbfdff]">
      <StepProgress step={stepIndex} total={total} title={headerTitle} />

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6 scrollbar-none">
        <section className="relative -mx-5 min-h-[10.5rem] overflow-hidden px-5 pt-8">
          <div className="pointer-events-none absolute right-0 bottom-0 h-[9.5rem] w-[72%] opacity-25">
            <Image
              src="/trips-covers/header-busan.png"
              alt=""
              fill
              sizes="(max-width: 512px) 72vw, 370px"
              className="object-cover object-[72%_58%]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#fbfdff] via-[#fbfdff]/88 to-transparent" />
          <h1 className="relative text-[1.85rem] font-extrabold tracking-[-0.055em] text-[#071b3f]">
            {title}
          </h1>
          {subtitle && (
            <p className="relative mt-2 text-base font-medium tracking-[-0.025em] text-[#687b99]">
              {subtitle}
            </p>
          )}
        </section>

        {error && (
          <p className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-[#F16E5E]">
            질문을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!error && questions === null && (
          <div className="grid place-items-center py-16">
            <span className="size-8 animate-spin rounded-full border-[3px] border-[#dfe8f4] border-t-[#2f7ff2]" />
          </div>
        )}

        <div className="flex flex-col gap-8">
        {stepQuestions.map((q) => {
          const multiple = q.type === "MULTIPLE_CHOICE";
          const selectedIds = selectedIdsFor(q);
          return (
            <section key={q.id} className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[1.15rem] font-extrabold tracking-[-0.035em] text-[#0a2148]">
                    {q.text}
                  </h2>
                  {multiple && (
                    <p className="mt-1 text-sm font-medium text-[#8795aa]">
                      {q.minSelections}~{q.maxSelections}개 선택 가능
                    </p>
                  )}
                </div>
                {multiple && (
                  <span className="shrink-0 rounded-full bg-[#eaf4ff] px-4 py-2 text-sm font-bold text-[#2376e9]">
                    {selectedIds.length} / {q.maxSelections} 선택
                  </span>
                )}
              </div>
              <AnswerGroup
                uiStep={uiStep}
                answers={q.answers}
                multiple={multiple}
                max={q.maxSelections}
                selectedIds={selectedIds}
                onToggle={(answerId) => toggle(q, answerId)}
              />
            </section>
          );
        })}
        </div>

        <div className="mt-auto pt-10">
          <button
            type="button"
            disabled={!ready}
            onClick={handleNext}
            className="w-full rounded-[1.1rem] bg-[#2f7ff2] py-4 text-center text-lg font-bold text-white shadow-[0_10px_24px_rgba(47,127,242,0.2)] transition-all hover:bg-[#246fe0] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </PageFade>
  );
}
