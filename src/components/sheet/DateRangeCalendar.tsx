"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

type DateRangeCalendarProps = {
  start: Date | null;
  end: Date | null;
  onSelect: (date: Date) => void;
  initialMonth?: Date;
};

export default function DateRangeCalendar({
  start,
  end,
  onSelect,
  initialMonth,
}: DateRangeCalendarProps) {
  const [viewedMonth, setViewedMonth] = useState(
    () => initialMonth ?? start ?? new Date()
  );

  const days = useMemo(() => {
    const year = viewedMonth.getFullYear();
    const month = viewedMonth.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewedMonth]);

  function inRange(date: Date) {
    if (!start || !end) return false;
    return date.getTime() > start.getTime() && date.getTime() < end.getTime();
  }

  const today = startOfToday();
  const selectedNights = start && end
    ? Math.round((end.getTime() - start.getTime()) / 86400000)
    : null;

  return (
    <section className="rounded-[1.65rem] border border-[#cfe0f6] bg-white px-4 pt-4 pb-5 shadow-[0_12px_30px_rgba(37,91,151,0.07)]">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() =>
            setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1))
          }
          className="grid size-10 place-items-center rounded-full text-[#15366c] transition-colors hover:bg-[#f0f6ff]"
        >
          <ChevronLeft size={26} strokeWidth={2.15} />
        </button>
        <p className="text-lg font-extrabold tracking-[-0.035em] text-[#102b59]">
          {viewedMonth.getFullYear()}년 {viewedMonth.getMonth() + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() =>
            setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1))
          }
          className="grid size-10 place-items-center rounded-full text-[#15366c] transition-colors hover:bg-[#f0f6ff]"
        >
          <ChevronRight size={26} strokeWidth={2.15} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-xs">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={`pb-2 font-bold ${
              i === 0 ? "text-[#ff4b75]" : i === 6 ? "text-[#2078ee]" : "text-[#4c6490]"
            }`}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center text-sm">
        {days.map((date, i) => {
          if (!date) return <span key={i} className="h-11" />;
          const startEdge = Boolean(start && sameDay(date, start));
          const endEdge = Boolean(end && sameDay(date, end));
          const within = inRange(date);
          const isPast = date.getTime() < today.getTime();
          const column = i % 7;
          const hasRange = Boolean(start && end && start.getTime() !== end.getTime());
          const weekday = date.getDay();
          return (
            <span key={i} className="relative grid h-11 place-items-center">
              {within && (
                <span className="absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 bg-[#e5f3ff]" />
              )}
              {hasRange && startEdge && column < 6 && (
                <span className="absolute top-1/2 right-0 left-1/2 h-8 -translate-y-1/2 bg-[#e5f3ff]" />
              )}
              {hasRange && endEdge && column > 0 && (
                <span className="absolute top-1/2 right-1/2 left-0 h-8 -translate-y-1/2 bg-[#e5f3ff]" />
              )}
              <button
                type="button"
                disabled={isPast}
                onClick={() => onSelect(date)}
                className={`relative z-10 grid size-10 place-items-center rounded-full text-sm font-semibold transition-all ${
                  isPast
                    ? "cursor-not-allowed text-[#c9d1dc]"
                    : startEdge && endEdge
                      ? "bg-linear-to-br from-[#2f7ff2] to-[#18c5b7] text-white shadow-[0_6px_14px_rgba(47,127,242,0.24)]"
                      : startEdge
                        ? "bg-[#2f7ff2] text-white shadow-[0_6px_14px_rgba(47,127,242,0.24)]"
                        : endEdge
                          ? "bg-[#26c3c6] text-white shadow-[0_6px_14px_rgba(38,195,198,0.24)]"
                          : within
                            ? "text-[#244b7e]"
                            : weekday === 0
                              ? "text-[#ff4b75] hover:bg-[#fff1f4]"
                              : weekday === 6
                                ? "text-[#2078ee] hover:bg-[#eef6ff]"
                                : "text-[#294873] hover:bg-[#f0f6ff]"
                }`}
              >
                {date.getDate()}
              </button>
            </span>
          );
        })}
      </div>

      {selectedNights != null && (
        <p className="mt-4 text-center text-sm font-semibold text-[#315c99]">
          {selectedNights === 0
            ? "당일 여행 선택됨"
            : `${selectedNights}박 ${selectedNights + 1}일 선택됨`}
        </p>
      )}
    </section>
  );
}
