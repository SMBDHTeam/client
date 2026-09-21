import type { ScheduleSummary } from "@/types/api/schedule";

export type TripStatus = "여행중" | "진행 임박" | "예정" | "완료";

export const STATUS_STYLE: Record<TripStatus, string> = {
    여행중: "bg-[#E6F7F3] text-[#17B89B]",
    "진행 임박": "bg-[#E6F7F3] text-[#17B89B]",
    예정: "bg-[#E8F1FE] text-[#2E7DF2]",
    완료: "bg-[#FFE8E5] text-[#D74432]",
};

const PLANNED_COVERS = [
    "/trips-covers/cover-coastal-temple.png",
    "/trips-covers/cover-hillside.png",
];
const ZERO_PLAN_COVERS = [
    "/trips-covers/cover-gwangalli.png",
    "/trips-covers/cover-harbor-market.png",
];

export function getScheduleCover(schedule: ScheduleSummary) {
    // These generated covers decorate the cards; they do not represent scheduled stops.
    const covers = schedule.scheduleType === "SPONTANEOUS" ? ZERO_PLAN_COVERS : PLANNED_COVERS;
    const variant = [...schedule.id].reduce((total, character) => total + character.charCodeAt(0), 0);
    return covers[variant % covers.length];
}

export function parseDate(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`);
}

export function startOfDay(date: Date) {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    return today;
}

export function diffDays(from: Date, to: Date) {
    return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function formatDateLabel(startDate: string, endDate: string) {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    const startLabel = `${start.getMonth() + 1}.${start.getDate()}`;
    if (startDate === endDate) return startLabel;
    const endLabel = `${end.getMonth() + 1}.${end.getDate()}`;
    return `${startLabel} - ${endLabel}`;
}

export function formatDuration(dayCount: number) {
    if (dayCount <= 1) return "당일";
    return `${dayCount - 1}박${dayCount}일`;
}

export function getDateStatus(schedule: ScheduleSummary, today: Date): TripStatus {
    const end = parseDate(schedule.endDate);
    if (diffDays(today, end) < 0) return "완료";
    const start = parseDate(schedule.startDate);
    if (diffDays(today, start) <= 7) return "진행 임박";
    return "예정";
}

export function parseDateTime(value?: string | null) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function getStatus(schedule: ScheduleSummary, now: Date): TripStatus {
    if (schedule.scheduleType === "SPONTANEOUS") {
        const startAt = parseDateTime(schedule.startAt);
        const endAt =
            parseDateTime(schedule.estimatedReturnAt) ?? parseDateTime(schedule.returnBy);
        const timestampsAreOrdered = !startAt || !endAt || startAt.getTime() <= endAt.getTime();

        if (endAt && timestampsAreOrdered && now.getTime() >= endAt.getTime()) return "완료";

        if (startAt && endAt && timestampsAreOrdered) {
            if (now.getTime() < startAt.getTime()) return "예정";
            return "여행중";
        }
    }

    return getDateStatus(schedule, startOfDay(now));
}

export function getScheduleTitle(schedule: ScheduleSummary) {
    return schedule.scheduleType === "SPONTANEOUS" ? "제로플랜" : schedule.styleSummary;
}

export function getFeaturedStatusLabel(schedule: ScheduleSummary, now: Date) {
    const status = getStatus(schedule, now);
    if (
        schedule.scheduleType === "SPONTANEOUS" &&
        (status === "여행중" || status === "완료")
    ) {
        return status;
    }

    const dday = diffDays(startOfDay(now), parseDate(schedule.startDate));
    return dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : "여행중";
}
