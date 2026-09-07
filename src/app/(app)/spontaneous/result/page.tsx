"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NaverMap from "@/components/map/NaverMap";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import type { CourseItem } from "@/types/api/spontaneous-trip";

const MARKER_COLORS = ["#2E7DF2", "#17B89B", "#F59E0B", "#E85D75", "#8B7DF2"];
const CARD_GRADIENTS = [
  "from-[#2E7DF2] to-[#17B89B]",
  "from-[#F7A18E] to-[#F16E5E]",
  "from-[#8B7DF2] to-[#5B5EE8]",
  "from-[#17B89B] to-[#2E9A6D]",
  "from-[#F59E0B] to-[#EF4444]",
];

const ROLE_LABEL: Record<string, string> = {
  ACTIVITY: "관광",
  MEAL: "식사",
  CAFE: "카페",
  NIGHT_VIEW: "야경",
};

function formatKST(utcString: string) {
  return new Date(utcString).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
    hour12: false,
  });
}

function buildPlaces(course: CourseItem[]) {
  return course.map((item, index) => ({
    order: item.order,
    name: item.name,
    role: item.role,
    lat: item.latitude,
    lng: item.longitude,
    color: MARKER_COLORS[index % MARKER_COLORS.length],
    gradient: CARD_GRADIENTS[index % CARD_GRADIENTS.length],
    arrivalAt: formatKST(item.arrivalAt),
    departureAt: formatKST(item.departureAt),
    stayMinutes: item.stayMinutes,
    travelMinutes: item.travelMinutesFromPrevious,
    themes: item.themes,
  }));
}

export default function SpontaneousResultPage() {
  const router = useRouter();
  const { draft, resetDraft } = useSpontaneousDraft();
  const [activeIndex, setActiveIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draft.course) {
      router.replace("/spontaneous");
    }
  }, [draft.course, router]);

  const places = useMemo(() => buildPlaces(draft.course?.course ?? []), [draft.course]);

  const route = useMemo(
    () => places.map((p) => ({ lat: p.lat, lng: p.lng, order: p.order, color: p.color })),
    [places],
  );

  const activeRoute = (() => {
    const dest = route[activeIndex];
    if (!dest) return [];
    if (activeIndex === 0) return [dest];
    return [route[activeIndex - 1], dest];
  })();

  const progress = places.length > 1 ? (activeIndex / (places.length - 1)) * 100 : 0;

  useEffect(() => {
    function recalc() {
      const viewport = viewportRef.current;
      const track = viewport?.firstElementChild as HTMLElement | null;
      const card = track?.firstElementChild as HTMLElement | null;
      if (!viewport || !card) return;
      const step = card.offsetWidth + 12;
      setOffset(viewport.offsetWidth / 2 - activeIndex * step - card.offsetWidth / 2);
    }
    recalc();
    const frame = requestAnimationFrame(() => setAnimate(true));
    window.addEventListener("resize", recalc);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", recalc);
    };
  }, [activeIndex, places]);

  function goTo(index: number) {
    setActiveIndex(Math.min(places.length - 1, Math.max(0, index)));
  }

  if (!draft.course) return null;

  const { course } = draft;
  const estimatedReturn = formatKST(course.estimatedReturnAt);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-5 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">{course.name}</h1>
          <p className="text-xs text-zinc-400">{draft.startLocation?.name}에서 출발</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetDraft();
            router.replace("/spontaneous");
          }}
          className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-zinc-500 hover:bg-black/5"
        >
          새로
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pt-2 pb-6">
        {route.length > 0 && (
          <NaverMap
            center={{ lat: activeRoute[0]?.lat ?? route[0].lat, lng: activeRoute[0]?.lng ?? route[0].lng }}
            route={activeRoute}
            activeOrder={places[activeIndex]?.order}
            className="h-64 w-full overflow-hidden rounded-3xl"
          />
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">오늘의 코스</h2>
          <p className="text-xs text-zinc-400">{places.length}곳</p>
        </div>

        {places.length > 0 && (
          <>
            <div className="relative">
              <div ref={viewportRef} className="-mx-5 overflow-hidden py-1">
                <div
                  className={`flex gap-3 ${animate ? "transition-transform duration-300 ease-out" : ""}`}
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  {places.map((place, index) => (
                    <div
                      key={place.order}
                      onClick={() => goTo(index)}
                      className={`w-[80%] shrink-0 cursor-pointer overflow-hidden rounded-3xl bg-white text-left shadow-sm ring-1 transition-all duration-300 ${
                        index === activeIndex ? "ring-2 ring-[#2E7DF2]" : "opacity-60 ring-black/5"
                      }`}
                    >
                      <div
                        className={`relative flex h-40 flex-col justify-between p-4 text-white bg-linear-to-br ${place.gradient}`}
                      >
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-black/20" />

                        <div className="relative flex items-start justify-between">
                          <span
                            className="grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow"
                            style={{ background: place.color }}
                          >
                            {place.order}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              {ROLE_LABEL[place.role] ?? place.role}
                            </span>
                            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              {place.arrivalAt}
                            </span>
                          </div>
                        </div>

                        <div className="relative">
                          <p className="truncate text-base font-bold">{place.name}</p>
                          {place.themes.length > 0 && (
                            <p className="truncate text-xs text-white/70">
                              {place.themes.slice(0, 2).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3">
                        <p className="text-xs font-medium text-zinc-500">
                          체류 {place.stayMinutes}분
                        </p>
                        {place.travelMinutes > 0 && (
                          <p className="text-xs text-zinc-400">
                            이동 {place.travelMinutes}분
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                aria-label="이전 장소"
                className="absolute top-1/2 left-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl leading-none text-zinc-700 shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                disabled={activeIndex === places.length - 1}
                aria-label="다음 장소"
                className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl leading-none text-zinc-700 shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
              >
                ›
              </button>
            </div>

            <div className="flex justify-center gap-1.5">
              {places.map((place, index) => (
                <span
                  key={place.order}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? "w-5 bg-[#2E7DF2]" : "w-1.5 bg-zinc-200"
                  }`}
                />
              ))}
            </div>

            <div className="px-1">
              <div className="relative h-2 rounded-full bg-zinc-200">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-[#2E7DF2] to-[#17B89B]"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#2E7DF2] bg-white shadow-md"
                  style={{ left: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex justify-between text-xs text-zinc-400">
                {places.map((place, index) => (
                  <span
                    key={place.order}
                    className={index === activeIndex ? "font-bold text-[#2E7DF2]" : ""}
                  >
                    {place.arrivalAt}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="rounded-2xl bg-zinc-50 px-4 py-3">
          <p className="text-xs font-semibold text-zinc-500">복귀 정보</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-zinc-600">
              마지막 장소에서 <span className="font-bold">{course.returnTravelMinutes}분</span> 이동
            </p>
            <p className="text-sm font-bold text-[#17B89B]">{estimatedReturn} 도착 예정</p>
          </div>
        </div>
      </div>
    </div>
  );
}
