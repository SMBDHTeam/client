"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepProgress from "@/components/StepProgress";
import { PACES } from "@/mocks/options";

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
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export default function AiStep2Page() {
  const router = useRouter();
  const [pace, setPace] = useState<(typeof PACES)[number]["id"]>("relaxed");

  return (
    <div className="flex flex-1 flex-col">
      <StepProgress step={2} total={3} />

      <div className="flex flex-1 flex-col gap-6 px-5 pt-6 pb-6">
        <section>
          <h1 className="text-2xl font-bold">선호하는 여행 일정은?</h1>
          <p className="mt-1 text-sm text-zinc-500">여행 스타일에 맞춰 일정 밀도를 조절해요</p>
        </section>

        <div className="flex flex-col gap-3">
          {PACES.map((p) => {
            const on = pace === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPace(p.id)}
                className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                  on ? "border-[#2E7DF2] bg-[#EAF2FE]" : "border-zinc-200 bg-white"
                }`}
              >
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white ${p.gradient}`}
                >
                  {PACE_ICONS[p.id]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{p.desc}</p>
                </div>
                <span
                  className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full border-2 ${
                    on ? "border-[#2E7DF2] bg-[#2E7DF2] text-white" : "border-zinc-300 bg-white"
                  }`}
                >
                  {on && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => router.push("/trips/new/step3")}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white"
        >
          다음
        </button>
      </div>
    </div>
  );
}
