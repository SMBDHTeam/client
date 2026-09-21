import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ScheduleSummary } from "@/types/api/schedule";
import {
    STATUS_STYLE,
    formatDateLabel,
    getScheduleCover,
    getScheduleTitle,
    getStatus,
} from "@/lib/trips/schedule-helpers";

export default function ScheduleListItem({ schedule, now }: { schedule: ScheduleSummary; now: Date }) {
    return (
        <li className="relative">
            <Link
                href={`/trips/${schedule.id}`}
                className="relative flex aspect-[3.58] min-h-[110px] items-center gap-[clamp(16px,3.75vw,19px)] overflow-hidden rounded-[20px] bg-white p-[clamp(10px,2.35vw,12px)] pr-[clamp(42px,9.86vw,48px)] pl-[clamp(16px,3.75vw,19px)] shadow-[0_5px_20px_rgba(44,112,191,0.08)] transition-colors hover:bg-[#F8FBFF]"
            >
                <span className={`absolute inset-y-0 left-0 w-[5px] ${schedule.scheduleType === "SPONTANEOUS" ? "bg-[#F48779]" : "bg-[#2E7DF2]"}`} />
                <span className="relative aspect-square w-[23%] min-w-[80px] max-w-[110px] shrink-0 overflow-hidden rounded-[13px]">
                    <Image
                        src={getScheduleCover(schedule)}
                        alt=""
                        fill
                        sizes="(max-width: 512px) 23vw, 110px"
                        className="object-cover"
                    />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-[clamp(15px,3.52vw,17px)] font-semibold">{getScheduleTitle(schedule)}</span>
                    <span className="mt-1 block text-[clamp(12px,2.8vw,14px)] text-[#64758E]">
                        {formatDateLabel(schedule.startDate, schedule.endDate)} · {schedule.stopCount}곳
                    </span>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[clamp(11px,2.58vw,12px)] font-medium ${STATUS_STYLE[getStatus(schedule, now)]}`}>
                        {getStatus(schedule, now)}
                    </span>
                </span>
                <ChevronRight className="size-[clamp(19px,4.46vw,23px)] shrink-0 text-[#64758E]" strokeWidth={1.8} aria-hidden />
            </Link>
        </li>
    );
}
