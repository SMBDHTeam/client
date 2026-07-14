"use client";

import { useRouter } from "next/navigation";

export default function AppHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="뒤로 가기"
        className="-ml-1 grid size-8 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
      >
        ‹
      </button>
      <h1 className="flex-1 text-center text-base font-semibold">{title}</h1>
      <span className="size-8" aria-hidden />
    </header>
  );
}
