"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Search, Trash2 } from "lucide-react";

import PlacesEmptyAnimation from "@/components/trip/PlacesEmptyAnimation";
import PageFade from "@/components/ui/PageFade";
import { useTripDraft } from "@/store/trip-draft";
import type { PlaceSearchItem } from "@/types/api/place";

const QUICK_SEARCHES = ["광안리", "해운대", "전포 카페", "감천문화마을"];

function MiniPlacePin() {
  return (
    <svg viewBox="0 0 24 30" className="h-5 w-4 shrink-0" aria-hidden="true">
      <path
        d="M12 1C5.8 1 1.5 5.6 1.5 11.4 1.5 19 12 29 12 29s10.5-10 10.5-17.6C22.5 5.6 18.2 1 12 1Z"
        fill="#2e7df2"
      />
      <circle cx="12" cy="11" r="3.7" fill="#fff" />
    </svg>
  );
}

function isSamePlace(left: PlaceSearchItem, right: PlaceSearchItem) {
  if (left.placeId !== null && right.placeId !== null) return left.placeId === right.placeId;
  return left.source === right.source && left.externalId === right.externalId;
}

function selectionKey(place: PlaceSearchItem) {
  return place.placeId !== null
    ? `place:${place.placeId}`
    : `${place.source}:${place.externalId}`;
}

export default function TripPlacesIntroPage() {
  const router = useRouter();
  const { draft, updateDraft } = useTripDraft();
  const selectedPlaces = draft.selectedPlaces;

  function removePlace(place: PlaceSearchItem) {
    const nextPlaces = selectedPlaces.filter((item) => !isSamePlace(item, place));
    updateDraft({
      selectedPlaces: nextPlaces,
      mustVisitPlaceIds: nextPlaces.flatMap((item) =>
        item.placeId === null ? [] : [item.placeId],
      ),
    });
  }

  return (
    <PageFade className="flex min-h-0 flex-1 flex-col bg-[#fbfdff]">
      <header className="relative h-28 shrink-0 overflow-hidden px-5 pt-4">
        <Image
          src="/trips-covers/header-busan.png"
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 512px"
          className="object-cover object-[68%_58%] opacity-55"
        />
        <div className="absolute inset-0 bg-linear-to-b from-white/40 via-white/35 to-[#fbfdff]" />
        <button
          type="button"
          onClick={() => router.push("/trips/new/step3")}
          aria-label="뒤로 가기"
          className="absolute top-4 left-3 z-10 grid size-10 place-items-center rounded-full text-[#0d234f] transition-colors hover:bg-white/70"
        >
          <ChevronLeft size={29} strokeWidth={2.2} />
        </button>
        <div className="relative z-10 flex flex-col items-center pt-1">
          <h1 className="text-xl font-extrabold tracking-[-0.04em] text-[#091d42]">가고 싶은 곳</h1>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-2 pb-6 scrollbar-none">
        <Link
          href="/trips/new/places/search"
          className="flex min-h-14 items-center gap-3 rounded-[1.35rem] border border-[#d5e0ed] bg-white px-5 shadow-[0_7px_20px_rgba(38,78,125,0.06)] transition-colors hover:border-[#9fc5fb]"
        >
          <Search size={24} strokeWidth={2} className="shrink-0 text-[#506888]" aria-hidden />
          <span className="text-base font-medium text-[#72829a]">장소를 검색해 담아보세요</span>
        </Link>

        <section className="relative mt-4 overflow-hidden rounded-[1.55rem] bg-[#eaf5ff] px-4 pt-5 pb-6 shadow-[0_9px_26px_rgba(56,107,157,0.06)]">
          <AnimatePresence mode="wait">
            {selectedPlaces.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-full max-w-[18rem]">
                  <PlacesEmptyAnimation />
                </div>
                <div className="-mt-2 text-center">
                  <h2 className="text-[1.2rem] leading-tight font-extrabold tracking-[-0.045em] text-[#081d42]">
                    검색해서 장소를 추가해 보세요
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#71839e]">
                    추가한 장소를 중심으로 동선을 만들어요
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.ul
                key="selected"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="mt-3 flex max-h-[19rem] flex-col gap-2 overflow-y-auto pr-0.5"
              >
                <AnimatePresence initial={false}>
                  {selectedPlaces.map((place, index) => (
                    <motion.li
                      layout
                      key={selectionKey(place)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 18 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 rounded-[1.15rem] border border-white/80 bg-white/95 p-3 shadow-[0_5px_14px_rgba(41,83,130,0.07)]"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8f3ff] text-sm font-extrabold text-[#2e7df2]">
                        {index + 1}
                      </span>
                      {place.primaryImageUrl ? (
                        // 외부 장소 이미지 도메인이 API 응답마다 달라 일반 img로 표시한다.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={place.primaryImageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="size-12 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eaf5ff] text-[#2e7df2]">
                          <MapPin size={23} aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#10254e]">{place.name}</span>
                        <span className="mt-1 block truncate text-xs text-[#7d8ca3]">
                          {[place.categoryLabel, place.address].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removePlace(place)}
                        aria-label={`${place.name} 삭제`}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-[#8796aa] transition-colors hover:bg-[#edf4fb] hover:text-[#315d94]"
                      >
                        <Trash2 size={17} aria-hidden />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </AnimatePresence>
        </section>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="추천 검색어">
          {QUICK_SEARCHES.map((keyword) => (
            <Link
              key={keyword}
              href={`/trips/new/places/search?q=${encodeURIComponent(keyword)}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#d7e1ee] bg-white px-3.5 py-2 text-sm font-bold text-[#203555] transition-colors hover:border-[#9fc5fb] hover:bg-[#f4f9ff]"
            >
              <MiniPlacePin />
              {keyword}
            </Link>
          ))}
        </div>

        <section className="mt-7">
          <h2 className="text-[1.55rem] font-extrabold tracking-[-0.05em] text-[#071b3f]">
            꼭 가고 싶은 곳이 있나요?
          </h2>
          <p className="mt-2 text-sm leading-relaxed font-medium text-[#6e7f99]">
            먼저 담아두면 그 장소를 중심으로 동선까지 맞춰 일정을 짜드려요
          </p>
        </section>

        <div className="mt-auto flex flex-col gap-3 pt-7">
          <Link
            href="/trips/new/places/search"
            className="flex w-full items-center justify-center rounded-[1.15rem] bg-[#2e7df2] py-4 text-center text-lg font-bold text-white shadow-[0_10px_24px_rgba(46,125,242,0.2)] transition-colors hover:bg-[#246fe0]"
          >
            가고 싶은 곳 담기
          </Link>
          <Link
            href="/trips/new/preview"
            className="w-full rounded-[1.15rem] border border-[#cbd7e6] bg-white py-4 text-center text-base font-bold text-[#152744] transition-colors hover:bg-[#f7faff]"
          >
            건너뛰고 AI에게 맡기기
          </Link>
        </div>
      </div>
    </PageFade>
  );
}
