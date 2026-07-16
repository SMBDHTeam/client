"use client";

import { useRouter } from "next/navigation";
import StepProgress from "@/components/StepProgress";
import { PACES } from "@/mocks/options";
import { useTripDraft } from "@/store/trip-draft";

const PACE_ICONS: Record<(typeof PACES)[number]["id"], React.ReactNode> = {
  packed: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" fill="currentColor" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" fill="currentColor" />
    </svg>
  ),
  relaxed: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8v4l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const PACE_ANSWER_IDS = {
  packed: "PACE_PACKED",
  relaxed: "PACE_RELAXED",
} as const;

const TRANSIT_OPTIONS = [
  {
    id: "simple",
    title: "환승은 적게",
    desc: "조금 돌아가도 편하게 이동해요",
    gradient: "from-[#17B89B] to-[#2E9A6D]",
  },
  {
    id: "fast",
    title: "빠른 이동 우선",
    desc: "환승이 늘어도 이동 시간을 줄여요",
    gradient: "from-[#F7A18E] to-[#F16E5E]",
  },
] as const;

const TRANSIT_ICONS: Record<(typeof TRANSIT_OPTIONS)[number]["id"], React.ReactNode> = {
  simple: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 8h11l-3-3M19 16H8l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  fast: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m13 2-8 12h6l-1 8 9-13h-6V2Z" fill="currentColor" />
    </svg>
  ),
};

const TRANSIT_ANSWER_IDS = {
  simple: "TRANSIT_SIMPLE",
  fast: "TRANSIT_FAST",
} as const;

function PreferenceCard({
  title,
  description,
  gradient,
  icon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  gradient: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
        selected ? "border-[#2E7DF2] bg-[#EAF2FE]" : "border-zinc-200 bg-white"
      }`}
    >
      <div
        className={`grid size-12 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white ${gradient}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <span
        className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
          selected
            ? "border-[#2E7DF2] bg-[#2E7DF2] text-white"
            : "border-zinc-300 bg-white"
        }`}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12l5 5L20 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}

export default function TripPreferenceStepTwoPage() {
  const router = useRouter();
  const { draft, setAnswer } = useTripDraft();
  const selectedPaceAnswer = draft.selectedAnswers.find(
    (answer) => answer.questionId === "PACE",
  )?.answerIds[0];
  const selectedTransitAnswer = draft.selectedAnswers.find(
    (answer) => answer.questionId === "TRANSIT",
  )?.answerIds[0];
  const pace = selectedPaceAnswer === PACE_ANSWER_IDS.packed ? "packed" : "relaxed";
  const transit = selectedTransitAnswer === TRANSIT_ANSWER_IDS.fast ? "fast" : "simple";

  function selectPace(nextPace: (typeof PACES)[number]["id"]) {
    setAnswer("PACE", [PACE_ANSWER_IDS[nextPace]]);
  }

  function selectTransit(nextTransit: (typeof TRANSIT_OPTIONS)[number]["id"]) {
    setAnswer("TRANSIT", [TRANSIT_ANSWER_IDS[nextTransit]]);
  }

  function continueFlow() {
    if (!selectedPaceAnswer) setAnswer("PACE", [PACE_ANSWER_IDS.relaxed]);
    if (!selectedTransitAnswer) setAnswer("TRANSIT", [TRANSIT_ANSWER_IDS.simple]);
    router.push("/trips/new/step3");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepProgress step={2} total={3} />

      <div className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-6">
        <section>
          <h1 className="text-2xl font-bold">선호하는 여행 일정은?</h1>
          <p className="mt-1 text-sm text-zinc-500">여행 스타일에 맞춰 일정 밀도를 조절해요</p>
        </section>

        <div role="radiogroup" aria-label="여행 일정 방식" className="flex flex-col gap-3">
          {PACES.map((option) => {
            const selected = pace === option.id;
            return (
              <PreferenceCard
                key={option.id}
                title={option.title}
                description={option.desc}
                gradient={option.gradient}
                icon={PACE_ICONS[option.id]}
                selected={selected}
                onClick={() => selectPace(option.id)}
              />
            );
          })}
        </div>

        <section className="border-t border-zinc-100 pt-6">
          <h2 className="text-base font-bold">환승은 어떻게 할까요?</h2>
          <div role="radiogroup" aria-label="환승 방식" className="mt-3 flex flex-col gap-3">
            {TRANSIT_OPTIONS.map((option) => (
              <PreferenceCard
                key={option.id}
                title={option.title}
                description={option.desc}
                gradient={option.gradient}
                icon={TRANSIT_ICONS[option.id]}
                selected={transit === option.id}
                onClick={() => selectTransit(option.id)}
              />
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={continueFlow}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white"
        >
          다음
        </button>
      </div>
    </div>
  );
}
