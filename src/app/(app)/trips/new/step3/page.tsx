"use client";

import { useRouter } from "next/navigation";
import StepProgress from "@/components/StepProgress";
import OptionChips from "@/components/OptionChips";
import { STYLES } from "@/mocks/options";

export default function AiStep3Page() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <StepProgress step={3} total={3} />

      <div className="flex flex-1 flex-col gap-8 px-5 pt-6 pb-6">
        <section className="flex flex-col items-center gap-4 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-linear-to-br from-[#8B7DF2] to-[#5B5EE8] text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3l1.8 4.9L19 9.5l-4.9 1.8L12 16l-1.8-4.7L5 9.5l5.2-1.6L12 3Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold">
            내가 선호하는
            <br />
            여행 스타일은?
          </h1>
          <p className="text-sm text-zinc-500">여러 개 선택할 수 있어요</p>
        </section>

        <OptionChips options={STYLES} multi />

        <button
          type="button"
          onClick={() => router.push("/trips/new/places")}
          className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white"
        >
          일정 만들기 <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
