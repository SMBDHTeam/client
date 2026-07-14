"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import DateRangeCalendar from "@/components/DateRangeCalendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatPoint(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}`;
}

export default function TripDatePage() {
  const router = useRouter();
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const nights = start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) : 0;

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

  return (
    <div className="flex flex-1 flex-col">
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
            <p className="text-center text-sm font-medium text-[#2E7DF2]">
              ● {nights}박 {nights + 1}일 선택됨
            </p>

            <div className="grid grid-cols-2 gap-3">
              <label className="rounded-2xl border-2 border-zinc-200 bg-white p-3">
                <p className="text-xs text-zinc-400">출발 시간</p>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full text-base font-bold outline-none"
                />
              </label>
              <label className="rounded-2xl border-2 border-zinc-200 bg-white p-3">
                <p className="text-xs text-zinc-400">도착 시간</p>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full text-base font-bold outline-none"
                />
              </label>
            </div>
          </>
        )}

        <button
          type="button"
          disabled={!start || !end}
          onClick={() => router.push("/trips/new/step1")}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
