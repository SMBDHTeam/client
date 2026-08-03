"use client";

import AppHeader from "@/components/AppHeader";
import PageFade from "@/components/PageFade";

export default function ProfilePage() {
  return (
    <PageFade className="flex flex-1 flex-col">
      <AppHeader title="내정보" />
      <div className="grid flex-1 place-items-center px-5 text-center text-zinc-400">
        준비 중인 화면이에요
      </div>
    </PageFade>
  );
}
