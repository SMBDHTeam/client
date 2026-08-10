"use client";

import { useRouter } from "next/navigation";

export default function StepProgress({
  step,
  total,
  title,
}: {
  step: number;
  total: number;
  title?: string;
}) {
  const router = useRouter();
  const percent = (step / total) * 100;

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        {title && (
          <h1 className="flex-1 truncate text-center text-base font-semibold">
            {title}
          </h1>
        )}
        <span className="shrink-0 text-sm font-medium text-zinc-400">
          {step}/{total}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-linear-to-r from-[#2E7DF2] to-[#17B89B]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
