import type { ScheduleTransit } from "../types/api/schedule";
import type { ScheduleRouteLine } from "../types/api/schedule-map";

const KST_DATE_TIME = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type ZonedParts = {
  dateKey: string;
  dayNumber: number;
  time: string;
};

function zonedParts(value: string): ZonedParts | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = Object.fromEntries(
    KST_DATE_TIME.formatToParts(date).map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  if (![year, month, day].every(Number.isFinite) || !parts.hour || !parts.minute) {
    return null;
  }

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    dayNumber: Math.floor(Date.UTC(year, month - 1, day) / 86_400_000),
    time: `${parts.hour}:${parts.minute}`,
  };
}

export function formatCourseTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const localTime = /^(\d{2}):(\d{2})/.exec(value);
  if (localTime) return `${localTime[1]}:${localTime[2]}`;
  return zonedParts(value)?.time ?? null;
}

export function formatKoreanReturnTime(
  estimatedReturnAt: string | null | undefined,
  startAt: string | null | undefined,
): string | null {
  if (!estimatedReturnAt) return null;
  const estimated = zonedParts(estimatedReturnAt);
  if (!estimated) return null;
  const start = startAt ? zonedParts(startAt) : null;
  if (!start || start.dateKey === estimated.dateKey) return estimated.time;

  const dayDifference = estimated.dayNumber - start.dayNumber;
  if (dayDifference === 1) return `다음 날 ${estimated.time}`;
  if (dayDifference > 1) return `${dayDifference}일 후 ${estimated.time}`;
  return estimated.time;
}

export function resolveSaveIdempotencyKey(
  existingKey: string | null | undefined,
  createKey: () => string = () => crypto.randomUUID(),
) {
  return existingKey ?? createKey();
}

function isCoordinate(coordinate: [number, number]) {
  return coordinate.length === 2 && coordinate.every(Number.isFinite);
}

export function routeLinesForOrder(
  routeLines: ScheduleRouteLine[],
  routeOrder: number | null | undefined,
) {
  if (routeOrder == null) return [];
  return routeLines
    .filter((line) => line.routeOrder === routeOrder)
    .toSorted((left, right) => left.lineOrder - right.lineOrder);
}

export function renderableRouteLines(routeLines: ScheduleRouteLine[]) {
  return routeLines.filter(
    (line) => line.coordinates.length >= 2 && line.coordinates.every(isCoordinate),
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function coordinatesDistanceKm(coordinates: [number, number][]) {
  let distance = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const [previousLongitude, previousLatitude] = coordinates[index - 1];
    const [longitude, latitude] = coordinates[index];
    const latitudeDelta = toRadians(latitude - previousLatitude);
    const longitudeDelta = toRadians(longitude - previousLongitude);
    const previousLatitudeRadians = toRadians(previousLatitude);
    const latitudeRadians = toRadians(latitude);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(previousLatitudeRadians) *
        Math.cos(latitudeRadians) *
        Math.sin(longitudeDelta / 2) ** 2;
    distance += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return distance;
}

export function routeDistanceKm(routeLines: ScheduleRouteLine[]): number | null {
  let distance = 0;
  let measured = false;

  for (const line of routeLines) {
    if (line.distanceMeters != null && line.distanceMeters >= 0) {
      distance += line.distanceMeters / 1000;
      measured = true;
      continue;
    }
    if (line.coordinates.length >= 2 && line.coordinates.every(isCoordinate)) {
      distance += coordinatesDistanceKm(line.coordinates);
      measured = true;
    }
  }

  return measured ? distance : null;
}

export function hasPublicTransit(transit: ScheduleTransit | null | undefined) {
  return Boolean(
    transit?.segments.some((segment) =>
      ["BUS", "SUBWAY", "TRAIN"].includes(segment.mode),
    ),
  );
}

export type CourseTransferPoint = {
  name: string;
  lat: number;
  lng: number;
  mode: string;
  lineName: string | null;
};

export function transferPointsForRoute(
  routeLines: ScheduleRouteLine[],
): CourseTransferPoint[] {
  return routeLines
    .filter(
      (line) =>
        ["BUS", "SUBWAY", "TRAIN"].includes(line.mode) &&
        line.coordinates.length > 0 &&
        isCoordinate(line.coordinates[0]),
    )
    .slice(1)
    .map((line, index) => ({
      name: `환승 ${index + 1}`,
      lat: line.coordinates[0][1],
      lng: line.coordinates[0][0],
      mode: line.mode,
      lineName: line.lineName,
    }));
}
