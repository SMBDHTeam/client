"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
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
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-3 text-left transition-colors hover:border-[#2E7DF2]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EAF2FE] text-[#2E7DF2]">
        <MapPin size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-zinc-400">출발지</span>
        <span
          className={`block truncate text-base font-semibold ${
            value ? "text-zinc-900" : "text-zinc-400"
          }`}
        >
          {value?.name ?? "역, 터미널 또는 장소를 검색하세요"}
        </span>
      </span>
      <span className="shrink-0 text-zinc-300" aria-hidden>
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
  const [startLocation, setStartLocation] = useState<LocationInput | undefined>(
    draft.startLocation,
  );
  const [picker, setPicker] = useState<"start" | null>(null);
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
    <PageFade className="flex flex-1 flex-col">
      <AppHeader title="여행 날짜" />

      <div className="flex flex-1 flex-col gap-6 px-5 pb-6">
        <section>
          <h1 className="text-2xl font-bold">언제 떠나시나요?</h1>
          <p className="mt-1 text-sm text-zinc-500">출발일과 도착일을 선택해 주세요</p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-2xl border-2 p-3 ${
              start && !end ? "border-[#2E7DF2] bg-[#EAF2FE]" : "border-zinc-200 bg-white"
            }`}
          >
            <p className="text-xs text-zinc-400">가는 날</p>
            <p className="mt-1 text-base font-bold">{start ? formatPoint(start) : "-"}</p>
          </div>
          <div
            className={`rounded-2xl border-2 p-3 ${
              start && end ? "border-[#2E7DF2] bg-[#EAF2FE]" : "border-zinc-200 bg-white"
            }`}
          >
            <p className="text-xs text-zinc-400">오는 날</p>
            <p className="mt-1 text-base font-bold">{end ? formatPoint(end) : "-"}</p>
          </div>
        </div>

        <DateRangeCalendar start={start} end={end} onSelect={handleSelect} />

        {start && end && (
          <>
            {tooLong ? (
              <p className="text-center text-sm font-medium text-[#F16E5E]">
                여행 기간은 최대 4일까지 선택할 수 있어요
              </p>
            ) : (
              <p className="text-center text-sm font-medium text-[#2E7DF2]">
                {nights === 0 ? "당일 여행 선택됨" : `${nights}박 ${nights + 1}일 선택됨`}
              </p>
            )}

            <section className="flex flex-col gap-3 border-t border-zinc-100 pt-5">
              <h2 className="text-sm font-semibold">출발지</h2>
              <LocationField value={startLocation ?? null} onOpen={() => setPicker("start")} />
            </section>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          disabled={!ready}
          onClick={continueFlow}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
        >
          다음
        </button>
      </div>

      {picker && (
        <LocationPickerSheet
          title="출발지 선택"
          initial={startLocation}
          onClose={() => setPicker(null)}
          onSelect={setStartLocation}
        />
      )}
    </PageFade>
  );
}
