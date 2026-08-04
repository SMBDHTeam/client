"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSchedule, ApiError } from "@/services";
import { buildCreateRequest, clearDraft, readDraft } from "@/store/tripDraft";

export function useCreateSchedule() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (creating) return;
    setError(null);
    let request;
    try {
      request = buildCreateRequest(readDraft());
    } catch (e) {
      setError(e instanceof Error ? e.message : "입력을 확인해 주세요.");
      return;
    }

    setCreating(true);
    try {
      const schedule = await createSchedule(request);
      clearDraft();
      router.push(`/trips/${schedule.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "INVALID_SCHEDULE_CONDITION") {
        setError(
          "조건에 맞는 일정을 만들지 못했어요. 날짜·시간이나 장소를 조정해 주세요.",
        );
      } else {
        setError("일정 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
      setCreating(false);
    }
  }

  return { create, creating, error };
}
