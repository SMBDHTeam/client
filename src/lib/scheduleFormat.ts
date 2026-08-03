import { Bus, Footprints, TrainFront, type LucideIcon } from "lucide-react";
import type { ScheduleListItem, TransitMode } from "@/types/api";

export const GRADIENTS = [
  "from-[#2E7DF2] to-[#17B89B]",
  "from-[#F7A18E] to-[#F16E5E]",
  "from-[#8B7DF2] to-[#5B5EE8]",
  "from-[#5AA9F0] to-[#3B7DE0]",
];

const STOP_COLORS = ["#17B89B", "#F16E5E", "#2E7DF2", "#8B7DF2", "#3B7DE0"];

export function gradientFor(index: number) {
  return GRADIENTS[index % GRADIENTS.length];
}

export function stopColor(index: number) {
  return STOP_COLORS[index % STOP_COLORS.length];
}

export function hhmm(time: string | null | undefined) {
  return time ? time.slice(0, 5) : "";
}

function nightsOf(s: Pick<ScheduleListItem, "startDate" | "endDate">) {
  const start = new Date(`${s.startDate}T00:00:00`);
  const end = new Date(`${s.endDate}T00:00:00`);
  return Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 86400000),
  );
}

export function durationLabel(
  s: Pick<ScheduleListItem, "startDate" | "endDate">,
) {
  const nights = nightsOf(s);
  return nights === 0 ? "당일" : `${nights}박 ${nights + 1}일`;
}

function md(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

export function dateRange(
  s: Pick<ScheduleListItem, "startDate" | "endDate">,
) {
  return s.startDate === s.endDate
    ? md(s.startDate)
    : `${md(s.startDate)} - ${md(s.endDate)}`;
}

export function placesCount(s: Pick<ScheduleListItem, "days">) {
  return s.days.reduce((sum, d) => sum + (d.stops?.length ?? 0), 0);
}

export function scheduleTitle(
  s: Pick<ScheduleListItem, "styleSummary" | "startDate" | "endDate">,
) {
  if (s.styleSummary && !s.styleSummary.includes(":")) return s.styleSummary;
  return `부산 ${durationLabel(s)} 여행`;
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "예정",
  DRAFT: "임시저장",
  COMPLETED: "완료",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}


type ModeMeta = { icon: LucideIcon; label: string; color: string };

const MODE_META: Record<TransitMode, ModeMeta> = {
  WALK: { icon: Footprints, label: "도보", color: "#9CA3AF" },
  BUS: { icon: Bus, label: "버스", color: "#2E7DF2" },
  SUBWAY: { icon: TrainFront, label: "지하철", color: "#F59E0B" },
};

export function transitModeMeta(mode: string): ModeMeta {
  return MODE_META[mode as TransitMode] ?? MODE_META.BUS;
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "아침",
  LUNCH: "점심",
  DINNER: "저녁",
};

export function mealLabel(slot: string | null): string | null {
  return slot ? (MEAL_LABELS[slot] ?? null) : null;
}

export function stripHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function fareLabel(fare: number | null): string | null {
  return typeof fare === "number" && fare > 0
    ? `${fare.toLocaleString("ko-KR")}원`
    : null;
}

export const STATUS_STYLE: Record<string, string> = {
  예정: "bg-[#E8F1FE] text-[#2E7DF2]",
  "진행 임박": "bg-[#E6F7F3] text-[#17B89B]",
  임시저장: "bg-zinc-100 text-zinc-500",
  완료: "bg-zinc-100 text-zinc-500",
};
