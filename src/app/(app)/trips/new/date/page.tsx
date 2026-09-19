"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";
import DateRangeCalendar from "@/components/sheet/DateRangeCalendar";
import LocationPickerSheet from "@/components/sheet/LocationPickerSheet";
import PageFade from "@/components/ui/PageFade";
import { useTripDraft } from "@/store/trip-draft";
import type { LocationInput } from "@/types/api/common";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatPoint(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}`;
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function differenceInDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function parseDate(value?: string) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

function LocationField({
  value,
  onOpen,
}: {
  value: LocationInput | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onOpen}
      className="flex h-16 w-full items-center gap-3 rounded-[1.2rem] border border-[#d7e1ee] bg-white px-3.5 text-left shadow-[0_6px_18px_rgba(35,75,123,0.05)] transition-colors hover:border-[#8dbbf8] active:bg-[#f7faff]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf4ff] text-[#2f7ff2]">
        <MapPin size={17} strokeWidth={2.1} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.7rem] font-medium text-[#8695aa]">출발지</span>
        <span
          className={`block truncate text-sm font-bold tracking-[-0.02em] ${
            value ? "text-[#10254e]" : "text-[#71819a]"
          }`}
        >
          {value?.name ?? "역, 터미널 또는 장소를 검색하세요"}
        </span>
      </span>
      <span className="shrink-0 pr-1 text-xl text-[#a7b5c7]" aria-hidden>
        ›
      </span>
    </button>
  );
}

export default function TripDatePage() {
  const router = useRouter();
  const { draft, updateDraft } = useTripDraft();
  const [start, setStart] = useState<Date | null>(() => parseDate(draft.startDate));
  const [end, setEnd] = useState<Date | null>(() => parseDate(draft.endDate));
  const [startLocation, setStartLocation] = useState<LocationInput | null>(
    draft.startLocation ?? null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nights = start && end ? differenceInDays(start, end) : 0;
  const tooLong = nights > 3;
  const ready = Boolean(start && end && !tooLong && startLocation);

  function handleSelect(date: Date) {
    setError(null);
    if (!start || (start && end)) {
      setStart(date);
      setEnd(null);
      return;
    }
    if (date.getTime() < start.getTime()) {
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
    if (!ready || !start || !end || !startLocation) return;
    updateDraft({
      startDate: toDateInput(start),
      endDate: toDateInput(end),
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

  return (
    <PageFade className="flex min-h-0 flex-1 flex-col bg-[#fbfdff]">
      <header className="relative flex h-24 shrink-0 items-center overflow-hidden px-5">
        <Image
          src="/trips-covers/header-busan.png"
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 512px"
          className="object-cover object-[68%_66%] opacity-70"
        />
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/60 to-white/12" />
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="relative z-10 -ml-2 grid size-11 place-items-center rounded-full text-[#0d234f] transition-colors hover:bg-white/65 active:bg-white/85"
        >
          <ChevronLeft size={34} strokeWidth={2.4} />
        </button>
        <h1 className="relative z-10 ml-2 text-[1.5rem] font-extrabold tracking-[-0.045em] text-[#0b2146]">
          여행 날짜
        </h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-6 scrollbar-none">
        <section>
          <h2 className="text-[1.45rem] font-extrabold tracking-[-0.05em] text-[#1769db]">
            언제 떠나시나요?
          </h2>
          <p className="mt-1 text-sm font-medium tracking-[-0.025em] text-[#526f9f]">
            출발일과 도착일을 선택해 주세요
          </p>
        </section>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div
            className={`flex h-[6.6rem] items-center justify-between rounded-[1.45rem] border px-4 transition-colors ${
              start && !end
                ? "border-[#2f7ff2] bg-[#f0f6ff]"
                : "border-[#c9d9ef] bg-white"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#5f78a2]">가는 날</p>
              <p className="mt-2 truncate text-base font-extrabold tracking-[-0.04em] text-[#102b59]">
                {start ? formatPoint(start) : "날짜 선택"}
              </p>
            </div>
            <CalendarDays className="ml-2 shrink-0 text-[#284e86]" size={25} strokeWidth={2} />
          </div>

          <div
            className={`flex h-[6.6rem] items-center justify-between rounded-[1.45rem] border px-4 transition-colors ${
              start && end
                ? "border-[#2f7ff2] bg-[#f0f6ff]"
                : "border-[#c9d9ef] bg-white"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#5f78a2]">오는 날</p>
              <p className="mt-2 truncate text-base font-extrabold tracking-[-0.04em] text-[#102b59]">
                {end ? formatPoint(end) : "날짜 선택"}
              </p>
            </div>
            <CalendarDays className="ml-2 shrink-0 text-[#284e86]" size={25} strokeWidth={2} />
          </div>
        </div>

        <div className="mt-4">
          <DateRangeCalendar start={start} end={end} onSelect={handleSelect} />
        </div>

        {error && (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-[#e45f58]">
            {error}
          </p>
        )}

        {start && end && !tooLong && (
          <section className="mt-6 border-t border-[#dce8f5] pt-5">
            <h2 className="mb-3 text-lg font-extrabold tracking-[-0.04em] text-[#0b2146]">출발지</h2>
            <LocationField value={startLocation} onOpen={() => setPickerOpen(true)} />
          </section>
        )}

        <button
          type="button"
          disabled={!ready}
          onClick={continueFlow}
          className="mt-5 w-full rounded-full bg-linear-to-r from-[#2f7bf4] via-[#20acd8] to-[#36d6bd] py-4 text-center text-base font-bold text-white shadow-[0_10px_24px_rgba(31,142,202,0.2)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          다음
        </button>
      </div>

      {pickerOpen && (
        <LocationPickerSheet
          title="출발지 선택"
          initial={startLocation}
          onClose={() => setPickerOpen(false)}
          onSelect={setStartLocation}
        />
      )}
    </PageFade>
  );
}
