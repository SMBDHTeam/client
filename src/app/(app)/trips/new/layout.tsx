"use client";

import { useTripDraft } from "@/store/trip-draft";

export default function TripNewLayout({ children }: { children: React.ReactNode }) {
  const { hydrated } = useTripDraft();

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center" aria-label="입력 내용 복원 중">
        <div className="size-9 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
      </div>
    );
  }

  return <>{children}</>;
}
