"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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

  return (
    <section>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() =>
            setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() - 1, 1))
          }
          className="grid size-8 place-items-center rounded-full text-zinc-400 hover:bg-black/5"
        >
          ‹
        </button>
        <p className="text-lg font-bold">
          {viewedMonth.getFullYear()}년 {viewedMonth.getMonth() + 1}월
        </p>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() =>
            setViewedMonth(new Date(viewedMonth.getFullYear(), viewedMonth.getMonth() + 1, 1))
          }
          className="grid size-8 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center text-sm">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={`pb-2 font-medium ${
              i === 0 ? "text-red-400" : i === 6 ? "text-[#2E7DF2]" : "text-zinc-500"
            }`}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
        {days.map((date, i) => {
          if (!date) return <span key={i} />;
          const edge = (start && sameDay(date, start)) || (end && sameDay(date, end));
          const within = inRange(date);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(date)}
              className={`mx-auto grid size-10 place-items-center rounded-full font-medium transition-colors ${
                edge
                  ? "bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white"
                  : within
                    ? "bg-[#EAF2FE] text-[#2E7DF2]"
                    : "text-zinc-800 hover:bg-black/5"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}
