"use client";

import { useParams } from "next/navigation";
import ScheduleDetail from "@/components/trip/ScheduleDetail";

export default function TripDetailPage() {
    const params = useParams<{ id: string }>();
    return <ScheduleDetail scheduleId={params.id} />;
}
