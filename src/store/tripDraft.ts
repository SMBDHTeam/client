
import type { CreateScheduleRequest, LocationPoint } from "@/types/api";

const KEY = "trip-draft";

export type MustVisitPlace = {
  id: number;
  name: string;
  tag: string;
  longitude: number;
  latitude: number;
};

export type TripDraft = {
  startDate?: string; 
  endDate?: string;
  dailyStartTime?: string; 
  dailyEndTime?: string;
  startLocation?: LocationPoint;
  endLocation?: LocationPoint;
  answers: Record<string, string | string[]>;
  mustVisitPlaces: MustVisitPlace[];
};

const EMPTY: TripDraft = { answers: {}, mustVisitPlaces: [] };

export function readDraft(): TripDraft {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as TripDraft;
    return {
      ...EMPTY,
      ...parsed,
      answers: parsed.answers ?? {},
      mustVisitPlaces: parsed.mustVisitPlaces ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeDraft(patch: Partial<TripDraft>): TripDraft {
  const next = { ...readDraft(), ...patch };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function clearDraft() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(KEY);
}

export function buildCreateRequest(draft: TripDraft): CreateScheduleRequest {
  const { startDate, endDate, startLocation, answers, mustVisitPlaces } = draft;

  if (!startDate || !endDate) throw new Error("여행 날짜를 선택해 주세요.");
  if (!startLocation) throw new Error("출발지를 선택해 주세요.");

  const selectedAnswers = Object.entries(answers)
    .map(([questionId, answerId]) => ({
      questionId,
      answerIds: Array.isArray(answerId) ? answerId : [answerId],
    }))
    .filter((a) => a.answerIds.length > 0);
  if (selectedAnswers.length === 0)
    throw new Error("여행 취향 질문에 답해 주세요.");

  const req: CreateScheduleRequest = {
    startDate,
    endDate,
    startLocation,
    lodgingPlan: [],
    selectedAnswers,
    fixedEvents: [],
    dayOverrides: [],
  };
  if (mustVisitPlaces.length > 0) {
    req.mustVisitPlaces = mustVisitPlaces.map((p) => ({
      name: p.name,
      longitude: p.longitude,
      latitude: p.latitude,
    }));
  }
  return req;
}
