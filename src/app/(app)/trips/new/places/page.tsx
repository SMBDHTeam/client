"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PageFade from "@/components/ui/PageFade";
import searchIcon from "@/assets/icons/search.png";

export default function AiPlacesIntroPage() {
    const router = useRouter();
    const [travelIconData, setTravelIconData] = useState<object | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/animation/map-icons.json")
            .then((r) => r.json())
            .then((data) => { if (!cancelled) setTravelIconData(data); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    return (
        <PageFade className="flex flex-1 flex-col">
            <header className="flex items-center gap-2 px-5 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    aria-label="뒤로 가기"
                    className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
                >
                    ‹
                </button>
                <h1 className="flex-1 text-center text-base font-semibold">
                    가고 싶은 곳
                </h1>
                <span className="size-8 shrink-0" aria-hidden />
            </header>

            <div className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-6">
                <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-linear-to-br from-[#EAF2FE] to-[#E4FBF4] p-4">
                    <div className="absolute -top-10 -right-8 size-28 rounded-full bg-white/40 blur-2xl" />
                    <div className="absolute -bottom-8 -left-6 size-24 rounded-full bg-white/40 blur-xl" />

                    <Link
                        href="/trips/new/places/search"
                        className="relative flex items-center gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5"
                    >
                        <Image src={searchIcon} alt="" width={20} height={20} />

                        <span className="text-sm text-zinc-400">
                            장소를 검색해 담아보세요
                        </span>
                    </Link>

                    {travelIconData && (
                        <Lottie
                            animationData={travelIconData}
                            loop
                            className="relative mx-auto h-56 w-56"
                        />
                    )}
                </div>

                <section>
                    <p className="text-xs font-semibold text-[#2E7DF2]">
                        선택 · 원하면 건너뛰어도 돼요
                    </p>
                    <h1 className="mt-2 text-2xl font-bold leading-snug">
                        꼭 가고 싶은
                        <br />
                        곳이 있나요?
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                        먼저 담아두면 그 장소를 중심으로
                        <br />
                        동선까지 맞춰 일정을 짜드려요
                    </p>
                </section>

                <div className="mt-auto flex flex-col gap-3">
                    <Link
                        href="/trips/new/places/search"
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white"
                    >
                        가고 싶은 곳 담기
                    </Link>
                    <button
                        type="button"
                        onClick={() => router.push("/trips/new/preview")}
                        className="w-full rounded-full border border-zinc-200 bg-white py-3.5 text-center text-sm font-medium text-zinc-700"
                    >
                        건너뛰고 AI에게 맡기기
                    </button>
                </div>
            </div>
        </PageFade>
    );
}
