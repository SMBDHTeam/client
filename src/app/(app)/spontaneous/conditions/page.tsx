"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CarFront,
  ChevronLeft,
  Clock3,
  Coffee,
  Dumbbell,
  Fish,
  Footprints,
  Landmark,
  Leaf,
  MoonStar,
  Mountain,
  ShoppingBag,
  Trees,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";

import PageFade from "@/components/ui/PageFade";
import { ApiError } from "@/lib/api/axios";
import { getDestinations } from "@/lib/api/spontaneous-trips";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import type { TransportMode, TravelTheme } from "@/types/api/spontaneous-trip";

const MAX_THEME_SELECTIONS = 3;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const TRANSPORT_OPTIONS: {
  value: TransportMode;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "WALK", label: "도보", icon: Footprints },
  { value: "CAR", label: "자동차", icon: CarFront },
];

const THEME_OPTIONS: {
  value: TravelTheme;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "SEA", label: "바다", icon: Waves },
  { value: "SEAFOOD", label: "해산물", icon: Fish },
  { value: "FOOD", label: "음식", icon: Utensils },
  { value: "CAFE", label: "카페", icon: Coffee },
  { value: "WALK", label: "산책", icon: Trees },
  { value: "NIGHT_VIEW", label: "야경", icon: MoonStar },
  { value: "CULTURE", label: "문화", icon: Landmark },
  { value: "SHOPPING", label: "쇼핑", icon: ShoppingBag },
  { value: "HEALING", label: "힐링", icon: Leaf },
  { value: "NATURE", label: "자연", icon: Mountain },
  { value: "ACTIVITY", label: "액티비티", icon: Dumbbell },
];

function formatDisplayTime(value: string) {
  if (!value) return { period: "", time: "--:--" };

  const [hours, minutes] = value.split(":").map(Number);
  const period = hours < 12 ? "오전" : "오후";
  const hour = hours % 12 === 0 ? 12 : hours % 12;

  return {
    period,
    time: `${hour}:${String(minutes).padStart(2, "0")}`,
  };
}

function TimeInput({
  label,
  dateLabel,
  value,
  onChange,
}: {
  label: string;
  dateLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  type Period = "AM" | "PM";

  function selectionFromValue(timeValue: string) {
    const [hours = 0, minutes = 0] = timeValue.split(":").map(Number);
    return {
      period: (hours < 12 ? "AM" : "PM") as Period,
      hour: hours % 12 === 0 ? 12 : hours % 12,
      minute: minutes,
    };
  }

  const initialSelection = selectionFromValue(value);
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(initialSelection.period);
  const [selectedHour, setSelectedHour] = useState(initialSelection.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialSelection.minute);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { period, time } = formatDisplayTime(value);

  useEffect(() => {
    if (!open) return;

    const frameId = window.requestAnimationFrame(() => {
      pickerRef.current
        ?.querySelectorAll<HTMLElement>("[data-time-scroll-selected='true']")
        .forEach((element) => element.scrollIntoView({ block: "center" }));
    });

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openPicker() {
    const selection = selectionFromValue(value);
    setSelectedPeriod(selection.period);
    setSelectedHour(selection.hour);
    setSelectedMinute(selection.minute);
    setOpen(true);
  }

  function confirmTime() {
    const hour24 =
      selectedPeriod === "AM"
        ? selectedHour === 12
          ? 0
          : selectedHour
        : selectedHour === 12
          ? 12
          : selectedHour + 12;
    onChange(`${String(hour24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="flex h-[7.5rem] w-full flex-col rounded-[1.55rem] border border-[#bcd6fb] bg-linear-to-br from-[#f5f9ff] to-white px-4 py-4 text-left shadow-[0_7px_20px_rgba(39,112,210,0.04)] transition active:scale-[0.99]"
      >
        <span className="flex items-center gap-2 text-[#7b89a3]">
          <Clock3 size={21} strokeWidth={2.2} className="text-[#2f7ff2]" />
          <span className="text-sm font-semibold">{label}</span>
        </span>

        <span className="mt-2 self-start whitespace-nowrap rounded-full bg-[#2f7ff2] px-3 py-1 text-xs font-semibold text-white">
          {dateLabel}
        </span>

        <span className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-medium text-[#7c89a0]">{period}</span>
          <span className="text-[1.8rem] font-bold leading-none tracking-[-0.04em] text-[#0d1d48]">
            {time}
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#07152f]/30 px-3 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={pickerRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${label} 시간 선택`}
            className="w-full max-w-lg rounded-t-[2rem] bg-white px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(7,30,70,0.18)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-extrabold tracking-[-0.035em] text-[#0b2146]">
                  {label} 시간 선택
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#8996aa]">{dateLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-3 py-2 text-sm font-bold text-[#77869d] hover:bg-[#f2f5f9]"
              >
                취소
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <p className="text-center text-xs font-bold text-[#8a98ad]">오전·오후</p>
              <p className="text-center text-xs font-bold text-[#8a98ad]">시</p>
              <p className="text-center text-xs font-bold text-[#8a98ad]">분</p>
            </div>

            <div className="mt-2 grid h-52 grid-cols-3 gap-2 overflow-hidden rounded-[1.4rem] bg-[#f4f7fb] p-2">
              <div className="flex flex-col justify-center gap-1">
                {(["AM", "PM"] as const).map((item) => {
                  const selected = selectedPeriod === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSelectedPeriod(item)}
                      className={`h-12 rounded-xl text-sm font-bold transition-colors ${
                        selected
                          ? "bg-[#2f7ff2] text-white shadow-[0_5px_12px_rgba(47,127,242,0.24)]"
                          : "text-[#53647e] hover:bg-white"
                      }`}
                    >
                      {item === "AM" ? "오전" : "오후"}
                    </button>
                  );
                })}
              </div>

              <div className="snap-y snap-mandatory overflow-y-auto rounded-xl bg-white/70 py-20 scrollbar-none">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => {
                  const selected = selectedHour === hour;
                  return (
                    <button
                      key={hour}
                      type="button"
                      data-time-scroll-selected={selected}
                      onClick={() => setSelectedHour(hour)}
                      className={`flex h-11 w-full snap-center items-center justify-center rounded-xl text-base font-bold transition-colors ${
                        selected ? "bg-[#e7f1ff] text-[#2f7ff2]" : "text-[#53647e] hover:bg-[#f3f7fc]"
                      }`}
                    >
                      {String(hour).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>

              <div className="snap-y snap-mandatory overflow-y-auto rounded-xl bg-white/70 py-20 scrollbar-none">
                {Array.from({ length: 60 }, (_, minute) => minute).map((minute) => {
                  const selected = selectedMinute === minute;
                  return (
                    <button
                      key={minute}
                      type="button"
                      data-time-scroll-selected={selected}
                      onClick={() => setSelectedMinute(minute)}
                      className={`flex h-11 w-full snap-center items-center justify-center rounded-xl text-base font-bold transition-colors ${
                        selected ? "bg-[#e7f1ff] text-[#2f7ff2]" : "text-[#53647e] hover:bg-[#f3f7fc]"
                      }`}
                    >
                      {String(minute).padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#6f7f96]">
                {selectedPeriod === "AM" ? "오전" : "오후"} {selectedHour}:
                {String(selectedMinute).padStart(2, "0")}
              </p>
              <button
                type="button"
                onClick={confirmTime}
                className="min-w-28 rounded-full bg-[#2f7ff2] px-5 py-3 text-sm font-bold text-white shadow-[0_7px_16px_rgba(47,127,242,0.22)]"
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getCurrentKSTTime() {
  const kstDate = new Date(Date.now() + KST_OFFSET_MS);
  const hours = String(kstDate.getUTCHours()).padStart(2, "0");
  const minutes = String(kstDate.getUTCMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function toKSTIso(date: Date, time: string, dayOffset = 0) {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  kstDate.setUTCDate(kstDate.getUTCDate() + dayOffset);

  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}T${time}:00+09:00`;
}

function formatKSTDate(date: Date, dayOffset = 0) {
  const [, month, day] = toKSTIso(date, "00:00", dayOffset)
    .slice(0, 10)
    .split("-")
    .map(Number);

  return `${month}월 ${day}일`;
}

export default function SpontaneousConditionsPage() {
  const router = useRouter();
  const { draft, hydrated, setConditions, setDestinations } = useSpontaneousDraft();
  const initializedRef = useRef(false);
  const startTimeEditedRef = useRef(false);

  const [startTime, setStartTime] = useState("");
  const [returnTime, setReturnTime] = useState("03:00");
  const [today, setToday] = useState<Date | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("WALK");
  const [desiredThemes, setDesiredThemes] = useState<TravelTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.startLocation) router.replace("/spontaneous");
  }, [hydrated, draft.startLocation, router]);

  useEffect(() => {
    if (!hydrated || initializedRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      setStartTime(getCurrentKSTTime());
      setReturnTime("03:00");
      if (draft.conditions) {
        setTransportMode(draft.conditions.transportMode);
        setDesiredThemes(draft.conditions.desiredThemes.slice(0, MAX_THEME_SELECTIONS));
      }
      initializedRef.current = true;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [draft.conditions, hydrated]);

  useEffect(() => {
    const updateToday = () => {
      setToday(new Date());
      if (!startTimeEditedRef.current) {
        setStartTime(getCurrentKSTTime());
      }
    };
    const frameId = window.requestAnimationFrame(updateToday);
    const intervalId = window.setInterval(updateToday, 60_000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
    };
  }, []);

  const isNextDayReturn = Boolean(
    startTime && returnTime && returnTime < startTime,
  );
  const timeError = startTime && returnTime && startTime === returnTime
    ? "출발 시각과 복귀 시각은 달라야 해요"
    : isNextDayReturn && returnTime > "03:00"
      ? "다음 날 복귀는 오전 3시까지 가능해요"
      : null;
  const ready = Boolean(startTime && returnTime && !timeError && !loading);
  const returnDateLabel = today
    ? `${isNextDayReturn ? "내일" : "오늘"} · ${formatKSTDate(today, isNextDayReturn ? 1 : 0)}`
    : "";

  function toggleTheme(theme: TravelTheme) {
    setDesiredThemes((previous) => {
      if (previous.includes(theme)) {
        return previous.filter((item) => item !== theme);
      }
      if (previous.length >= MAX_THEME_SELECTIONS) return previous;
      return [...previous, theme];
    });
  }

  async function handleSubmit() {
    if (!draft.startLocation || !ready) return;

    const currentDate = new Date();
    const conditions = {
      startAt: toKSTIso(currentDate, startTime),
      returnBy: toKSTIso(currentDate, returnTime, isNextDayReturn ? 1 : 0),
      transportMode,
      desiredThemes,
    };

    setConditions(conditions);
    setError(null);
    setLoading(true);

    try {
      const data = await getDestinations({
        startLocation: {
          latitude: draft.startLocation.latitude,
          longitude: draft.startLocation.longitude,
        },
        ...conditions,
      });
      setDestinations(data.destinations);
      router.push("/spontaneous/destinations");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "목적지를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFade className="flex min-h-0 flex-1 flex-col bg-[#fcfdff]">
      <header className="relative flex h-16 shrink-0 items-center justify-center px-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="absolute left-3 grid size-11 place-items-center rounded-full text-[#0d234f] transition-colors hover:bg-[#f1f6fc] active:bg-[#e8f1fa]"
        >
          <ChevronLeft size={34} strokeWidth={2.35} />
        </button>
        <h1 className="text-xl font-bold tracking-[-0.035em] text-[#0b1d43]">여행 조건</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-none">
        <section className="relative h-[7.75rem] overflow-hidden px-5 pt-5">
          <Image
            src="/trips-covers/header-busan.png"
            alt=""
            fill
            priority
            sizes="(max-width: 512px) 100vw, 512px"
            className="object-cover object-[66%_65%] opacity-55"
          />
          <div className="absolute inset-0 bg-linear-to-r from-white via-white/85 to-white/15" />
          <div className="relative z-10">
            <h2 className="text-[1.85rem] font-extrabold tracking-[-0.055em] text-[#071b3f]">
              어떻게 여행할까요?
            </h2>
            {draft.startLocation && (
              <p className="mt-1 text-base font-medium tracking-[-0.025em] text-[#79879f]">
                {draft.startLocation.name}에서 출발
              </p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-7 px-4 pt-5 pb-6">
          <section>
            <h2 className="mb-3 text-[1.15rem] font-extrabold tracking-[-0.035em] text-[#0a2148]">
              여행 시간
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <TimeInput
                label="출발"
                dateLabel={today ? `오늘 · ${formatKSTDate(today)}` : ""}
                value={startTime}
                onChange={(value) => {
                  startTimeEditedRef.current = true;
                  setStartTime(value);
                }}
              />
              <TimeInput
                label="복귀"
                dateLabel={returnDateLabel}
                value={returnTime}
                onChange={setReturnTime}
              />
            </div>
            {timeError && (
              <p className="mt-2 text-sm font-medium text-[#ef6254]">{timeError}</p>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-[1.15rem] font-extrabold tracking-[-0.035em] text-[#0a2148]">
              이동수단
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {TRANSPORT_OPTIONS.map(({ value, label, icon: Icon }) => {
                const selected = transportMode === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTransportMode(value)}
                    className={`flex h-14 cursor-pointer items-center justify-center gap-3 rounded-2xl border text-base font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? "border-[#2f7ff2] bg-[#eff6ff] text-[#2f7ff2] shadow-[0_5px_14px_rgba(47,127,242,0.08)] hover:bg-[#e4f0ff] hover:shadow-[0_8px_18px_rgba(47,127,242,0.16)]"
                        : "border-[#d6deea] bg-white text-[#4c5d7a] hover:border-[#8dbbff] hover:bg-[#f6faff] hover:text-[#2f7ff2] hover:shadow-[0_8px_18px_rgba(47,127,242,0.1)]"
                    }`}
                  >
                    <Icon size={28} strokeWidth={2.35} />
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="text-[1.15rem] font-extrabold tracking-[-0.035em] text-[#0a2148]">
                희망 테마
              </h2>
              <p className="text-sm font-medium text-[#8a97ac]">최대 3개 선택</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const selected = desiredThemes.includes(value);
                const selectionBlocked = !selected && desiredThemes.length >= MAX_THEME_SELECTIONS;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    aria-disabled={selectionBlocked}
                    onClick={() => toggleTheme(value)}
                    className={`flex h-[3.45rem] cursor-pointer items-center justify-center gap-2 rounded-2xl border px-2 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                      selected
                        ? "border-[#2f7ff2] bg-[#eff6ff] text-[#2f7ff2] shadow-[0_5px_14px_rgba(47,127,242,0.07)] hover:bg-[#e4f0ff] hover:shadow-[0_8px_18px_rgba(47,127,242,0.16)]"
                        : "border-[#d6deea] bg-white text-[#4b5c79] hover:border-[#8dbbff] hover:bg-[#f6faff] hover:text-[#2f7ff2] hover:shadow-[0_8px_18px_rgba(47,127,242,0.1)]"
                    } ${selectionBlocked ? "opacity-55" : ""}`}
                  >
                    <Icon size={24} strokeWidth={2.2} />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-[#ef6254]" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!ready}
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-linear-to-r from-[#347ff1] to-[#2f7ae7] py-4 text-lg font-bold text-white shadow-[0_10px_24px_rgba(47,127,242,0.2)] transition disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                목적지 찾는 중...
              </>
            ) : (
              <>
                추천 코스 만들기
                <ArrowRight size={25} strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </div>
    </PageFade>
  );
}
