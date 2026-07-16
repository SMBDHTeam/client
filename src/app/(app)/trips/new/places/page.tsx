"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import searchIcon from "@/assets/icons/search-256.png";

export default function TripPlacesIntroPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-6">
        <Link
          href="/trips/new/places/search"
          className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5"
        >
          <Image src={searchIcon} alt="" width={20} height={20} />
          <span className="text-sm text-zinc-400">장소를 검색해 담아보세요</span>
        </Link>

        <div className="grid h-48 place-items-center rounded-3xl bg-linear-to-br from-[#EAF2FE] to-[#E4FBF4]">
          <div className="grid size-20 place-items-center rounded-2xl bg-white shadow-sm">
            <Image src={searchIcon} alt="" width={42} height={42} />
          </div>
        </div>

        <section>
          <p className="text-xs font-semibold text-[#2E7DF2]">선택 · 원하면 건너뛰어도 돼요</p>
          <h1 className="mt-2 text-2xl font-bold leading-snug">꼭 가고 싶은<br />곳이 있나요?</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">먼저 담아두면 그 장소를 중심으로<br />동선까지 맞춰 일정을 짜드려요</p>
        </section>

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/trips/new/places/search"
            className="flex w-full items-center justify-center rounded-full bg-[#101828] py-3.5 font-medium text-white"
          >
            가고 싶은 곳 담기
          </Link>
          <Link
            href="/trips/new/preview"
            className="w-full rounded-full border border-zinc-200 bg-white py-3.5 text-center text-sm font-medium text-zinc-700"
          >
            건너뛰고 AI에게 맡기기
          </Link>
        </div>
      </div>
    </div>
  );
}
