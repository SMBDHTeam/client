"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function StepProgress({
  step,
  total,
  title,
  backHref,
}: {
  step: number;
  total: number;
  title?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const percent = (step / total) * 100;

  return (
    <div className="shrink-0 bg-[#fbfdff] px-5 pt-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => backHref ? router.replace(backHref) : router.back()}
          aria-label="뒤로 가기"
          className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-[#0d234f] transition-colors hover:bg-[#eef5ff]"
        >
          <ChevronLeft size={29} strokeWidth={2.2} />
        </button>
        {title && (
            <h1 className="flex-1 truncate text-center text-xl font-extrabold tracking-[-0.04em] text-[#091d42]">
            {title}
          </h1>
        )}
        <span className="w-10 shrink-0 text-right text-base font-medium text-[#6f7f9b]">
          {step} / {total}
        </span>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#edf0f4]">
        <div
          className="h-full rounded-full bg-[#2f7ff2] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
