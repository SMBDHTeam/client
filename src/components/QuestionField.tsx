"use client";

import type { TripQuestion } from "@/types/api/question";

export default function QuestionField({
  question,
  selectedIds,
  onChange,
  layout = "grid",
}: {
  question: TripQuestion;
  selectedIds: string[];
  onChange: (answerIds: string[]) => void;
  layout?: "grid" | "chips";
}) {
  function toggle(answerId: string) {
    if (question.type === "SINGLE_CHOICE") {
      onChange([answerId]);
      return;
    }
    if (selectedIds.includes(answerId)) {
      onChange(selectedIds.filter((id) => id !== answerId));
      return;
    }
    if (selectedIds.length < question.maxSelections) {
      onChange([...selectedIds, answerId]);
    }
  }

  return (
    <fieldset>
      <legend className="text-base font-bold">{question.text}</legend>
      <p className="mt-1 text-xs text-zinc-400">
        {question.type === "MULTIPLE_CHOICE"
          ? `${question.minSelections}개 이상 ${question.maxSelections}개까지 선택`
          : "하나만 선택"}
      </p>
      <div className={layout === "chips" ? "mt-4 flex flex-wrap justify-center gap-2" : "mt-3 grid grid-cols-2 gap-3"}>
        {question.answers
          .toSorted((a, b) => a.displayOrder - b.displayOrder)
          .map((answer) => {
            const selected = selectedIds.includes(answer.id);
            return (
              <button
                key={answer.id}
                type="button"
                role={question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                aria-checked={selected}
                onClick={() => toggle(answer.id)}
                className={`${layout === "chips" ? "rounded-full px-4 py-2 text-center" : "min-h-12 rounded-xl px-3 py-3 text-left"} border text-sm font-medium transition-colors ${
                  selected
                    ? "border-transparent bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {answer.label}
              </button>
            );
          })}
      </div>
    </fieldset>
  );
}
