"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NaverMap from "@/components/NaverMap";
import searchIcon from "@/assets/icons/search-256.png";

type Place = {
    id: string;
    name: string;
    tag: string;
    mapx?: number;
    mapy?: number;
    image?: string | null;
};

function PlaceThumbnail({
    place,
    broken,
    onError,
}: {
    place: Place;
    broken: boolean;
    onError: () => void;
}) {
    if (place.image && !broken) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={place.image}
                alt=""
                onError={onError}
                referrerPolicy="no-referrer"
                className="size-10 shrink-0 rounded-lg object-cover"
            />
        );
    }
    return (
        <div className="size-10 shrink-0 rounded-lg bg-linear-to-br from-[#2E7DF2] to-[#17B89B]" />
    );
}

export default function AiPlacesSearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [picked, setPicked] = useState<Place[]>([]);
    const [mapCenter, setMapCenter] = useState<
        { lat: number; lng: number } | undefined
    >();
    const [activePlace, setActivePlace] = useState<Place | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                searchWrapperRef.current &&
                !searchWrapperRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }

        console.log("Searching for:", trimmed);
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/places/search?query=${encodeURIComponent(trimmed)}`,
                );
                const data: {
                    items: {
                        id: string;
                        name: string;
                        tag: string;
                        mapx: number;
                        mapy: number;
                        image: string | null;
                    }[];
                } = await res.json();
                console.log(data);
                setResults(data.items);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    function focusPlace(place: Place) {
        if (place.mapx == null || place.mapy == null) return;
        setMapCenter({ lat: place.mapy / 1e7, lng: place.mapx / 1e7 });
        setActivePlace(place);
    }

    function addPlace(place: Place) {
        if (picked.some((p) => p.id === place.id)) return;
        setPicked((prev) => [...prev, place]);
    }

    function removePlace(id: string) {
        setPicked((prev) => prev.filter((p) => p.id !== id));
    }

    return (
        <div className="flex flex-1 flex-col">
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
                    일정 담기
                </h1>
                <Link
                    href="/trips"
                    className="shrink-0 text-sm font-medium text-zinc-400"
                >
                    건너뛰기
                </Link>
            </header>

            <div className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-6">
                <div className="relative" ref={searchWrapperRef}>
                    <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5">
                        <Image
                            src={searchIcon}
                            alt=""
                            width={16}
                            height={16}
                            className="shrink-0"
                        />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setShowResults(true)}
                            placeholder="장소를 검색해보세요"
                            className="w-full text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
                        />
                    </div>

                    {showResults && query.trim() && (
                        <div className="absolute inset-x-0 top-full z-20 max-h-64 overflow-y-auto rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
                            <ul className="flex flex-col gap-2">
                                {loading && results.length === 0 && (
                                    <p className="py-2 text-center text-sm text-zinc-400">
                                        검색 중...
                                    </p>
                                )}
                                {!loading && results.length === 0 && (
                                    <p className="py-2 text-center text-sm text-zinc-400">
                                        검색 결과가 없어요
                                    </p>
                                )}
                                {results.map((place) => {
                                    const already = picked.some(
                                        (p) => p.id === place.id,
                                    );
                                    return (
                                        <li
                                            key={place.id}
                                            onClick={() => focusPlace(place)}
                                            className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-zinc-50"
                                        >
                                            <PlaceThumbnail
                                                place={place}
                                                broken={failedImages.has(
                                                    place.id,
                                                )}
                                                onError={() =>
                                                    setFailedImages(
                                                        (prev) =>
                                                            new Set(
                                                                prev,
                                                            ).add(place.id),
                                                    )
                                                }
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {place.name}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-zinc-400">
                                                    {place.tag}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addPlace(place);
                                                    focusPlace(place);
                                                }}
                                                disabled={already}
                                                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                    already
                                                        ? "bg-zinc-100 text-zinc-400"
                                                        : "bg-[#EAF2FE] text-[#2E7DF2] hover:bg-[#DCEBFD]"
                                                }`}
                                            >
                                                {already ? "담음" : "+ 추가"}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                <NaverMap
                    center={mapCenter}
                    place={
                        activePlace
                            ? {
                                  name: activePlace.name,
                                  tag: activePlace.tag,
                                  alreadyAdded: picked.some(
                                      (p) => p.id === activePlace.id,
                                  ),
                              }
                            : null
                    }
                    onAddPlace={() =>
                        activePlace && addPlace(activePlace)
                    }
                    className="h-96 w-full shrink-0 rounded-2xl"
                />

                <div className="mt-auto -mx-5 -mb-6 rounded-t-3xl bg-white px-5 pt-4 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
                    <section>
                        <h2 className="mb-3 text-sm font-semibold">
                            담은 장소 {picked.length}
                        </h2>
                        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                            {picked.map((place, i) => (
                                <li
                                    key={place.id}
                                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                                >
                                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                                        {i + 1}
                                    </span>
                                    <PlaceThumbnail
                                        place={place}
                                        broken={failedImages.has(place.id)}
                                        onError={() =>
                                            setFailedImages((prev) =>
                                                new Set(prev).add(place.id),
                                            )
                                        }
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {place.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-zinc-400">
                                            {place.tag}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removePlace(place.id)}
                                        aria-label="삭제"
                                        className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-black/5"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden
                                        >
                                            <path
                                                d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1a2 2 0 0 1-2 1.9H8.7a2 2 0 0 1-2-1.9L6 7"
                                                stroke="currentColor"
                                                strokeWidth="1.6"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Link
                        href="/trips"
                        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white"
                    >
                        이 장소들로 일정 만들기 <span aria-hidden>→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
