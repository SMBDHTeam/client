"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import AppHeader from "@/components/navigation/AppHeader";
import DateRangeCalendar from "@/components/sheet/DateRangeCalendar";
import LocationPickerSheet from "@/components/sheet/LocationPickerSheet";
import PageFade from "@/components/ui/PageFade";
import type { LocationPoint } from "@/types/api";
import { readDraft, writeDraft } from "@/store/tripDraft";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatPoint(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}`;
}

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function LocationField({
  label,
  value,
  onOpen,
}: {
  label: string;
  value: LocationPoint | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white p-3 text-left transition-colors hover:border-[#2E7DF2]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EAF2FE] text-[#2E7DF2]">
        <MapPin size={18} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-zinc-400">{label}</span>
        <span
          className={`block truncate text-base font-semibold ${
            value ? "text-zinc-900" : "text-zinc-400"
          }`}
        >
          {value?.name ?? "장소를 검색해 주세요"}
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
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [startLocation, setStartLocation] = useState<LocationPoint | null>(null);
  const [picker, setPicker] = useState<"start" | null>(null);

  useEffect(() => {
    const draft0 = readDraft();
    if (draft0.startDate) setStart(new Date(`${draft0.startDate}T00:00:00`));
    if (draft0.endDate) setEnd(new Date(`${draft0.endDate}T00:00:00`));
    if (draft0.dailyStartTime) setStartTime(draft0.dailyStartTime.slice(0, 5));
    if (draft0.dailyEndTime) setEndTime(draft0.dailyEndTime.slice(0, 5));
    if (draft0.startLocation) setStartLocation(draft0.startLocation);
  }, []);

  const nights =
    start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) : 0;
  const tooLong = nights > 3;
  const ready = Boolean(start && end && !tooLong && startLocation);

  function handleSelect(date: Date) {
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
    setEnd(date);
  }

  function handleNext() {
    if (!ready || !start || !end || !startLocation) return;
    writeDraft({
      startDate: toISODate(start),
      endDate: toISODate(end),
      dailyStartTime: startTime,
      dailyEndTime: endTime,
      startLocation,
      endLocation: startLocation,
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
                ● {nights}박 {nights + 1}일 선택됨
              </p>
            )}


            <section className="flex flex-col gap-3 border-t border-zinc-100 pt-5">
              <h2 className="text-sm font-semibold">출발지</h2>
              <LocationField
                label="출발지"
                value={startLocation}
                onOpen={() => setPicker("start")}
              />
            </section>
          </>
        )}

        <button
          type="button"
          disabled={!ready}
          onClick={handleNext}
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
