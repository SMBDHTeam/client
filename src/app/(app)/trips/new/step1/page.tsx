"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepProgress from "@/components/StepProgress";
import { COMPANIONS } from "@/mocks/options";

export default function AiStep1Page() {
  const router = useRouter();
  const [companion, setCompanion] = useState<string | null>("친구와");
  const [mobilityImpaired, setMobilityImpaired] = useState<"예" | "아니오">("아니오");

  return (
    <div className="flex flex-1 flex-col">
      <StepProgress step={1} total={3} />

      <div className="flex flex-1 flex-col gap-8 px-5 pt-6 pb-6">
        <section>
          <h1 className="text-2xl font-bold">누구와 떠나나요?</h1>
          <p className="mt-1 text-sm text-zinc-500">하나만 선택해 주세요</p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {COMPANIONS.map((c) => {
            const on = companion === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCompanion(c)}
                className={`rounded-xl border p-4 text-left text-sm font-medium transition-colors ${
                  on
                    ? "border-transparent bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <section className="border-t border-zinc-100 pt-6">
          <h2 className="text-sm font-semibold">거동이 불편한 분이 계신가요?</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(["예", "아니오"] as const).map((v) => {
              const on = mobilityImpaired === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMobilityImpaired(v)}
                  className={`rounded-xl py-3.5 text-center text-sm font-semibold transition-colors ${
                    on
                      ? "bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="button"
          onClick={() => router.push("/trips/new/step2")}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white"
        >
          다음
        </button>
      </div>
    </div>
  );
}
