import { CONTRACT_LOCATIONS, CONTRACT_PLACES, CONTRACT_QUESTIONS } from "./contract-fixtures";
import type { LocationInput } from "@/types/api/common";
import type { PlaceSearchItem, ResolvedPlace } from "@/types/api/place";
import type { TripQuestionsResponse } from "@/types/api/question";
import type {
  CreateSchedulePreviewRequest,
  ResolvedDay,
  SchedulePreview,
} from "@/types/api/schedule-preview";
import type { ScheduleResponse, ScheduleStop } from "@/types/api/schedule";
import type { ScheduleMapResponse } from "@/types/api/schedule-map";
import { placeCategoryLabel } from "@/utils/place-category";

const PREVIEW_STORAGE_PREFIX = "tour:v2:preview:";
const SCHEDULE_STORAGE_PREFIX = "tour:v2:schedule:";

function wait(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function minutesToTime(minutes: number) {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function defaultStartTime(startDate: string) {
  const now = new Date();
  const todayInSeoul = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  if (startDate !== todayInSeoul) return "10:00";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const hours = Number(parts.find((part) => part.type === "hour")?.value ?? 10);
  const minutes = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return minutesToTime(Math.ceil((hours * 60 + minutes) / 30) * 30);
}

function locationForNight(
  request: CreateSchedulePreviewRequest,
  date: string,
): LocationInput | null {
  if (request.lodgingPlan.mode === "FIXED_BASE") {
    return request.lodgingPlan.baseLocation;
  }
  if (request.lodgingPlan.mode === "PER_NIGHT") {
    return request.lodgingPlan.nightStays.find((stay) => stay.date === date)?.location ?? null;
  }
  return null;
}

function resolvedLocations(
  request: CreateSchedulePreviewRequest,
  dates: string[],
  index: number,
): Pick<ResolvedDay, "startLocation" | "endLocation" | "startLocationSource" | "endLocationSource"> {
  const date = dates[index];
  const override = request.dayOverrides.find((item) => item.date === date);
  const previousNight = index > 0 ? locationForNight(request, dates[index - 1]) : null;
  const currentNight = index < dates.length - 1 ? locationForNight(request, date) : null;
  const isFirst = index === 0;
  const isLast = index === dates.length - 1;

  const startLocation = override?.startLocation ?? (isFirst ? request.startLocation ?? null : previousNight);
  const endLocation = override?.endLocation ?? (isLast ? request.endConstraint?.location ?? null : currentNight);

  return {
    startLocation,
    endLocation,
    startLocationSource: override?.startLocation
      ? "DAY_OVERRIDE"
      : isFirst
        ? "USER"
        : previousNight
          ? "LODGING"
          : "PLANNER_DECIDES",
    endLocationSource: override?.endLocation
      ? "DAY_OVERRIDE"
      : isLast && request.endConstraint
        ? "END_CONSTRAINT"
        : currentNight
          ? "LODGING"
          : "PLANNER_DECIDES",
  };
}

export async function mockGetTripQuestions(): Promise<TripQuestionsResponse> {
  await wait();
  return { items: CONTRACT_QUESTIONS };
}

export async function mockSearchLocations(keyword: string) {
  await wait();
  const normalized = keyword.trim().toLowerCase();
  return {
    items: CONTRACT_LOCATIONS.filter((item) =>
      `${item.name} ${item.address ?? ""}`.toLowerCase().includes(normalized),
    ),
  };
}

export async function mockSearchPlaces(keyword: string) {
  await wait();
  const normalized = keyword.trim().toLowerCase();
  const filtered = CONTRACT_PLACES.filter((item) =>
    `${item.name} ${item.category} ${item.address ?? ""}`.toLowerCase().includes(normalized),
  );
  return { items: filtered.length > 0 ? filtered : CONTRACT_PLACES };
}

export async function mockResolvePlace(place: PlaceSearchItem): Promise<ResolvedPlace> {
  await wait();
  const placeId =
    place.placeId ??
    900 +
      Array.from(place.externalId).reduce((total, character) => total + character.charCodeAt(0), 0) % 100;
  return {
    ...place,
    placeId,
    resolved: true,
    operatingInfoAvailable: place.source === "TOUR_API",
  };
}

export async function mockCreateSchedulePreview(
  request: CreateSchedulePreviewRequest,
): Promise<SchedulePreview> {
  await wait(450);
  if (!request.startDate || !request.endDate || !request.startLocation) {
    throw new Error("날짜와 출발 위치를 먼저 입력해 주세요.");
  }

  const dates = dateRange(request.startDate, request.endDate);
  const appliedDefaults: SchedulePreview["appliedDefaults"] = [];
  const conflicts: SchedulePreview["conflicts"] = [];
  const endBuffer = request.endConstraint?.bufferMinutes ??
    (request.endConstraint?.type === "FLIGHT_DEPARTURE"
      ? 90
      : request.endConstraint?.type === "TRAIN_DEPARTURE"
        ? 30
        : 0);

  const resolvedDays = dates.map((date, index): ResolvedDay => {
    const override = request.dayOverrides.find((item) => item.date === date);
    let availableFrom = override?.availableFrom ?? (index === 0 ? request.startTime : undefined);
    let availableUntil = override?.availableUntil ?? "20:00";

    if (!availableFrom) {
      availableFrom = index === 0 ? defaultStartTime(request.startDate!) : "10:00";
      appliedDefaults.push({
        fieldPath: `resolvedDays[${index}].availableFrom`,
        resolvedValue: availableFrom,
        reasonCode: index === 0 ? "DEFAULT_FIRST_DAY_START" : "DEFAULT_FULL_DAY_START",
      });
    }

    if (index === dates.length - 1 && request.endConstraint) {
      const targetTime = request.endConstraint.targetAt.slice(11, 16);
      availableUntil = minutesToTime(timeToMinutes(targetTime) - endBuffer);
    }

    const availableMinutes = timeToMinutes(availableUntil) - timeToMinutes(availableFrom);
    if (availableMinutes < 180) {
      conflicts.push({
        code: "INSUFFICIENT_AVAILABLE_TIME",
        message: `${date}에 일정을 구성할 시간이 부족합니다.`,
        fieldPath: `dayOverrides[${date}].availableUntil`,
        conflictDate: date,
        requiredMinutes: 180,
        availableMinutes,
        adjustableFields: [`dayOverrides[${date}].availableUntil`],
      });
    }

    return {
      date,
      availableFrom,
      availableUntil,
      ...resolvedLocations(request, dates, index),
    };
  });

  const sortedEvents = request.fixedEvents.toSorted((left, right) =>
    left.startsAt.localeCompare(right.startsAt),
  );
  sortedEvents.forEach((event, index) => {
    const overlapping = sortedEvents
      .slice(index + 1)
      .find((candidate) => candidate.startsAt < event.endsAt && candidate.endsAt > event.startsAt);
    if (!overlapping) return;
    conflicts.push({
      code: "FIXED_EVENT_CONFLICT",
      message: `${event.name}과(와) ${overlapping.name}의 시간이 겹칩니다.`,
      fieldPath: "fixedEvents",
      conflictDate: event.startsAt.slice(0, 10),
      adjustableFields: ["fixedEvents"],
    });
  });

  const preview: SchedulePreview = {
    previewId: crypto.randomUUID(),
    status: conflicts.length > 0 ? "REQUIRES_ACTION" : "READY",
    canGenerate: conflicts.length === 0,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    timeZone: "Asia/Seoul",
    lodgingMode: request.lodgingPlan.mode,
    routeCoverage: request.lodgingPlan.mode === "UNDECIDED" ? "ATTRACTION_ROUTES_ONLY" : "FULL",
    resolvedDays,
    resolvedEndConstraint: request.endConstraint
      ? {
          type: request.endConstraint.type,
          targetAt: request.endConstraint.targetAt,
          appliedBufferMinutes: endBuffer,
          availableUntil: resolvedDays.at(-1)?.availableUntil ?? "20:00",
        }
      : undefined,
    appliedDefaults,
    interpretedPrompt: {
      preferences: [
        ...(request.customPrompt?.includes("바다") ? ["PREFER_SEA_VIEW"] : []),
        ...(request.customPrompt?.includes("걷") ? ["LOW_WALKING"] : []),
      ],
      unrecognizedTexts: [],
      source: "RULE_BASED",
      confidence: 100,
    },
    warnings:
      request.lodgingPlan.mode === "UNDECIDED"
        ? [
            {
              code: "LODGING_ROUTE_EXCLUDED",
              date: null,
              message: "숙소 이동시간은 일정 경로에 포함되지 않습니다.",
            },
          ]
        : [],
    conflicts,
  };

  sessionStorage.setItem(`${PREVIEW_STORAGE_PREFIX}${preview.previewId}`, JSON.stringify(preview));
  return preview;
}

export async function mockGetSchedulePreview(previewId: string): Promise<SchedulePreview> {
  await wait();
  const stored = sessionStorage.getItem(`${PREVIEW_STORAGE_PREFIX}${previewId}`);
  if (!stored) throw new Error("Preview를 찾을 수 없습니다.");
  return JSON.parse(stored) as SchedulePreview;
}

function makeMockStops(selectedPlaces: PlaceSearchItem[], dayNo: number): ScheduleStop[] {
  const places = selectedPlaces.length > 0 ? selectedPlaces : CONTRACT_PLACES.slice(0, 2);
  return places.slice(0, 3).map((place, index) => ({
    id: `mock-stop-${dayNo}-${index + 1}`,
    order: index + 1,
    arriveAt: `${String(10 + index * 2).padStart(2, "0")}:00`,
    departAt: `${String(11 + index * 2).padStart(2, "0")}:00`,
    stayMinutes: 60,
    place: {
      id: place.placeId ?? 900 + index,
      name: place.name,
      category: place.category,
      categoryLabel: placeCategoryLabel(place.category),
      address: place.address ?? "부산광역시",
      longitude: place.longitude,
      latitude: place.latitude,
      primaryImageUrl: place.primaryImageUrl,
    },
    inboundTransit: null,
    mealTimeSlot: null,
    waitingMinutesBefore: 0,
  }));
}

export async function mockCreateSchedule(
  preview: SchedulePreview,
  selectedPlaces: PlaceSearchItem[],
): Promise<ScheduleResponse> {
  await wait(900);
  const id = `v2-${crypto.randomUUID()}`;
  const schedule: ScheduleResponse = {
    id,
    previewId: preview.previewId,
    status: "CONFIRMED",
    startDate: preview.resolvedDays[0].date,
    endDate: preview.resolvedDays.at(-1)?.date ?? preview.resolvedDays[0].date,
    styleSummary: "입력한 조건을 반영한 부산 여행",
    planningAssumptions: {
      timeZone: "Asia/Seoul",
      lodgingMode: preview.lodgingMode,
      routeCoverage: preview.routeCoverage,
      warnings: preview.warnings.map((warning) => warning.code),
    },
    days: preview.resolvedDays.map((day, index) => {
      const stops = makeMockStops(selectedPlaces, index + 1);
      const firstPlace = stops[0]?.place;
      const lastPlace = stops.at(-1)?.place;
      return {
        dayNo: index + 1,
        date: day.date,
        startTime: day.availableFrom,
        endTime: day.availableUntil,
        startLocation: day.startLocation ?? firstPlace ?? null,
        endLocation: day.endLocation ?? lastPlace ?? null,
        startLocationSource: day.startLocationSource,
        endLocationSource: day.endLocation ? day.endLocationSource : "LAST_STOP",
        summary: `Day ${index + 1} 추천 동선`,
        stops,
        finalTransit: null,
      };
    }),
  };
  sessionStorage.setItem(`${SCHEDULE_STORAGE_PREFIX}${id}`, JSON.stringify(schedule));
  return schedule;
}

export async function mockGetSchedule(scheduleId: string): Promise<ScheduleResponse> {
  await wait();
  const stored = sessionStorage.getItem(`${SCHEDULE_STORAGE_PREFIX}${scheduleId}`);
  if (!stored) throw new Error("일정을 찾을 수 없습니다.");
  return JSON.parse(stored) as ScheduleResponse;
}

export async function mockGetScheduleMap(
  scheduleId: string,
  dayNo?: number,
): Promise<ScheduleMapResponse> {
  const schedule = await mockGetSchedule(scheduleId);
  const days = dayNo ? schedule.days.filter((day) => day.dayNo === dayNo) : schedule.days;
  const firstDay = days[0];
  const lastDay = days.at(-1);

  return {
    startMarker: firstDay?.startLocation ?? null,
    endMarker: lastDay?.endLocation ?? null,
    markers: days.flatMap((day) =>
      day.stops.map((stop) => ({
        dayNo: day.dayNo,
        order: stop.order,
        placeId: stop.place.id,
        name: stop.place.name,
        arriveAt: stop.arriveAt,
        departAt: stop.departAt,
        subtitle: `${stop.place.category} · 체류 ${stop.stayMinutes}분`,
        riskLevel: stop.warnings?.length ? "NOTICE" : "NORMAL",
        longitude: stop.place.longitude,
        latitude: stop.place.latitude,
      })),
    ),
    routeLines: [],
  };
}
