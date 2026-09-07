"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import PageFade from "@/components/ui/PageFade";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import { getDestinations } from "@/lib/api/spontaneous-trips";
import { ApiError } from "@/lib/api/axios";
import { Clock } from "lucide-react";
import type { TransportMode, TravelTheme } from "@/types/api/spontaneous-trip";

const TRANSPORT_OPTIONS: { value: TransportMode; label: string }[] = [
  { value: "PUBLIC_TRANSIT", label: "대중교통" },
  { value: "WALK", label: "도보" },
  { value: "CAR", label: "자동차" },
];

const THEME_OPTIONS: { value: TravelTheme; label: string }[] = [
  { value: "SEA", label: "바다" },
  { value: "SEAFOOD", label: "해산물" },
  { value: "FOOD", label: "음식" },
  { value: "CAFE", label: "카페" },
  { value: "WALK", label: "산책" },
  { value: "NIGHT_VIEW", label: "야경" },
  { value: "CULTURE", label: "문화" },
  { value: "SHOPPING", label: "쇼핑" },
  { value: "HEALING", label: "힐링" },
  { value: "NATURE", label: "자연" },
  { value: "ACTIVITY", label: "액티비티" },
];

function formatDisplayTime(value: string) {
  if (!value) return { period: "", time: "--:--" };
  const [h, m] = value.split(":").map(Number);
  const period = h < 12 ? "오전" : "오후";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { period, time: `${hour}:${String(m).padStart(2, "0")}` };
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { period, time } = formatDisplayTime(value);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.showPicker()}
      className="flex w-full flex-col rounded-2xl border-2 border-[#2E7DF2] bg-[#EAF2FE] p-4 text-left"
    >
      <div className="flex items-center gap-1.5">
        <Clock size={13} className="text-[#2E7DF2]" />
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xs font-semibold text-zinc-500">{period}</span>
        <span className="text-xl font-bold text-zinc-800">{time}</span>
      </div>
      <input
        ref={inputRef}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </button>
  );
}

function toKSTIso(date: Date, time: string) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}T${time}:00+09:00`;
}

export default function SpontaneousConditionsPage() {
  const router = useRouter();
  const { draft, hydrated, setConditions, setDestinations } = useSpontaneousDraft();

  const [startTime, setStartTime] = useState("10:00");
  const [returnTime, setReturnTime] = useState("21:00");
  const [transportMode, setTransportMode] = useState<TransportMode>("PUBLIC_TRANSIT");
  const [desiredThemes, setDesiredThemes] = useState<TravelTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!draft.startLocation) {
      router.replace("/spontaneous");
    }
  }, [hydrated, draft.startLocation, router]);

  const timeError =
    startTime && returnTime && returnTime <= startTime
      ? "복귀 시각은 출발 시각보다 이후여야 해요"
      : null;

  const ready = Boolean(startTime && returnTime && !timeError && !loading);

  function toggleTheme(theme: TravelTheme) {
    setDesiredThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme],
    );
  }

  async function handleSubmit() {
    if (!draft.startLocation || !ready) return;

    const today = new Date();
    const startAt = toKSTIso(today, startTime);
    const returnBy = toKSTIso(today, returnTime);
    const conditions = { startAt, returnBy, transportMode, desiredThemes };

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
    <PageFade className="flex flex-1 flex-col">
      <AppHeader title="여행 조건" />

      <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 pt-6 pb-6">
        <section>
          <h1 className="text-2xl font-bold">어떻게 여행할까요?</h1>
          {draft.startLocation && (
            <p className="mt-1 text-sm text-zinc-500">{draft.startLocation.name}에서 출발</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">여행 시간</h2>
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="출발" value={startTime} onChange={setStartTime} />
            <TimeInput label="복귀" value={returnTime} onChange={setReturnTime} />
          </div>
          {timeError && (
            <p className="text-sm font-medium text-[#F16E5E]">{timeError}</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">이동수단</h2>
          <div className="grid grid-cols-3 gap-2">
            {TRANSPORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTransportMode(opt.value)}
                className={`rounded-2xl border p-3 text-center text-sm font-semibold transition-all ${
                  transportMode === opt.value
                    ? "border-transparent bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold">희망 테마</h2>
            <p className="text-xs text-zinc-400">
              선택 안 해도 돼요 ·{" "}
              <span className={desiredThemes.length > 0 ? "font-semibold text-[#2E7DF2]" : ""}>
                {desiredThemes.length}개 선택
              </span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => {
              const on = desiredThemes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTheme(opt.value)}
                  className={`rounded-2xl border p-3 text-center text-sm font-semibold transition-all ${
                    on
                      ? "border-transparent bg-linear-to-br from-[#2E7DF2] to-[#17B89B] text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {error && (
          <p className="text-sm font-medium text-[#F16E5E]">{error}</p>
        )}

        <button
          type="button"
          disabled={!ready}
          onClick={handleSubmit}
          className="mt-auto w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-medium text-white transition-opacity disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              목적지 찾는 중...
            </span>
          ) : (
            "목적지 추천 받기"
          )}
        </button>
      </div>
    </PageFade>
  );
}
