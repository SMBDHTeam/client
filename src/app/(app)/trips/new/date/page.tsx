"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import DateRangeCalendar from "@/components/DateRangeCalendar";
import LocationSearchField from "@/components/LocationSearchField";
import NaverMap from "@/components/NaverMap";
import { useTripDraft } from "@/store/trip-draft";
import type { LocationInput } from "@/types/api/common";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const TODAY_IN_SEOUL = "2026-08-09";

function parseDate(value?: string) {
  if (value && value < TODAY_IN_SEOUL) return null;
  return value ? new Date(`${value}T00:00:00`) : null;
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPoint(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}`;
}

function differenceInDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

export default function TripDatePage() {
  const router = useRouter();
  const { draft, updateDraft } = useTripDraft();
  const [start, setStart] = useState<Date | null>(() => parseDate(draft.startDate));
  const [end, setEnd] = useState<Date | null>(() => parseDate(draft.endDate));
  const [startLocation, setStartLocation] = useState<LocationInput | undefined>(draft.startLocation);
  const [pendingLocation, setPendingLocation] = useState<LocationInput | undefined>(draft.startLocation);
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const nights = start && end ? differenceInDays(start, end) : 0;

  useEffect(() => {
    if (!mapOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMapOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mapOpen]);

  function handleSelect(date: Date) {
    setError(null);
    if (!start || end) {
      setStart(date);
      setEnd(null);
      return;
    }
    if (date < start) {
      setStart(date);
      setEnd(null);
      return;
    }
    if (differenceInDays(start, date) > 3) {
      setError("여행 기간은 최대 4일까지 선택할 수 있어요.");
      return;
    }
    setEnd(date);
  }

  function continueFlow() {
    if (!start || !end || !startLocation) return;
    const startDate = toDateInput(start);
    const endDate = toDateInput(end);
    updateDraft({
      startDate,
      endDate,
      startLocation,
      startTime: undefined,
      lodgingPlan: { mode: "UNDECIDED" },
      endConstraint: undefined,
      fixedEvents: [],
      dayOverrides: [],
      customPrompt: undefined,
    });
    router.push("/trips/new/step1");
  }

  function openLocationSearch() {
    setPendingLocation(startLocation);
    setMapOpen(true);
  }

  function confirmLocation() {
    if (!pendingLocation) return;
    setStartLocation(pendingLocation);
    setMapOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="여행 날짜" />
      <div className="flex flex-1 flex-col gap-6 px-5 pb-6">
        <section>
          <h1 className="text-2xl font-bold">언제 떠나시나요?</h1>
          <p className="mt-1 text-sm text-zinc-500">출발일과 도착일을 선택해 주세요</p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl border-2 p-3 ${start && !end ? "border-[#2E7DF2] bg-[#EAF2FE]" : "border-zinc-200 bg-white"}`}>
            <p className="text-xs text-zinc-400">가는 날</p>
            <p className="mt-1 text-base font-bold">{start ? formatPoint(start) : "-"}</p>
          </div>
          <div className={`rounded-2xl border-2 p-3 ${start && end ? "border-[#2E7DF2] bg-[#EAF2FE]" : "border-zinc-200 bg-white"}`}>
            <p className="text-xs text-zinc-400">오는 날</p>
            <p className="mt-1 text-base font-bold">{end ? formatPoint(end) : "-"}</p>
          </div>
        </div>

        <DateRangeCalendar start={start} end={end} onSelect={handleSelect} />

        {start && end && (
          <p className="text-center text-sm font-medium text-[#2E7DF2]">
            {nights === 0 ? "당일 여행 선택됨" : `${nights}박 ${nights + 1}일 선택됨`}
          </p>
        )}

        <section className="border-t border-zinc-100 pt-5">
          <p className="text-sm font-semibold text-zinc-800">어디서 여행을 시작하나요?</p>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={openLocationSearch}
            className="mt-2 flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm transition-colors hover:border-[#2E7DF2]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 fill-none stroke-zinc-400 stroke-2">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
            <span className={`min-w-0 flex-1 truncate ${startLocation ? "font-semibold text-zinc-800" : "text-zinc-400"}`}>
              {startLocation?.name ?? "역, 터미널 또는 장소를 검색하세요"}
            </span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-zinc-400 stroke-2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          disabled={!start || !end || !startLocation}
          onClick={continueFlow}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
        >
          다음
        </button>
      </div>

      {mapOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="지도 닫기"
            onClick={() => setMapOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-location-search-title"
            className="relative z-10 max-h-[92dvh] w-full max-w-[500px] overflow-y-auto rounded-t-2xl bg-white p-5 pb-7 shadow-2xl"
          >
            <header className="mb-4 flex items-center justify-between gap-4">
              <h2 id="start-location-search-title" className="text-lg font-bold">
                출발 장소 찾기
              </h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setMapOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </header>

            <LocationSearchField
              key={pendingLocation ? `${pendingLocation.name}-${pendingLocation.longitude}-${pendingLocation.latitude}` : "empty"}
              label="장소 검색"
              value={pendingLocation}
              onChange={setPendingLocation}
              placeholder="역, 터미널 또는 장소를 검색하세요"
              autoFocus
            />

            <NaverMap
              center={pendingLocation ? { lat: pendingLocation.latitude, lng: pendingLocation.longitude } : undefined}
              place={pendingLocation ? {
                name: pendingLocation.name,
                tag: pendingLocation.address || "여행 시작 위치",
                alreadyAdded: true,
              } : null}
              showAddAction={false}
              showMarker={Boolean(pendingLocation)}
              className="mt-4 h-72 overflow-hidden rounded-xl border border-zinc-100"
            />

            <button
              type="button"
              disabled={!pendingLocation}
              onClick={confirmLocation}
              className="mt-4 w-full rounded-full bg-[#2E7DF2] py-3.5 font-semibold text-white disabled:opacity-40"
            >
              선택 완료
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
