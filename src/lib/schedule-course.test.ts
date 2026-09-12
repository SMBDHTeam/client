import assert from "node:assert/strict";
import test from "node:test";
import {
  formatKoreanReturnTime,
  hasPublicTransit,
  renderableRouteLines,
  resolveSaveIdempotencyKey,
  routeLinesForOrder,
  transferPointsForRoute,
} from "./schedule-course.ts";
import type { ScheduleTransit } from "../types/api/schedule.ts";
import type { ScheduleRouteLine } from "../types/api/schedule-map.ts";

function routeLine(
  routeOrder: number,
  lineOrder: number,
  coordinates: [number, number][],
  mode = "BUS",
): ScheduleRouteLine {
  return {
    dayNo: 1,
    routeOrder,
    lineOrder,
    mode,
    lineName: null,
    startName: null,
    endName: null,
    durationMinutes: null,
    distanceMeters: null,
    instruction: null,
    fallbackUsed: false,
    coordinates,
  };
}

function transit(modes: string[]): ScheduleTransit {
  return {
    routeType: "INBOUND",
    routeOrder: 1,
    originName: null,
    destinationName: null,
    summary: null,
    departAt: null,
    arriveAt: null,
    totalMinutes: 10,
    walkMinutes: 0,
    waitMinutes: 0,
    transferCount: 0,
    fareAmount: null,
    provider: null,
    realtimeStatus: "UNAVAILABLE",
    fallbackUsed: false,
    segments: modes.map((mode, index) => ({
      order: index + 1,
      mode,
      lineName: null,
      startStationId: null,
      startStationName: null,
      endStationId: null,
      endStationName: null,
      instruction: null,
      durationMinutes: 10,
      distanceMeters: null,
      stationCount: null,
      waitMinutes: 0,
      realtimeStatus: "UNAVAILABLE",
    })),
    warnings: [],
  };
}

test("한국 시간 날짜가 바뀌면 복귀 시간을 다음 날로 표시한다", () => {
  assert.equal(
    formatKoreanReturnTime("2026-09-13T16:30:00Z", "2026-09-13T14:00:00Z"),
    "다음 날 01:30",
  );
  assert.equal(
    formatKoreanReturnTime("2026-09-13T15:30:00+09:00", "2026-09-13T09:00:00+09:00"),
    "15:30",
  );
});

test("선택한 장소 순서의 실제 좌표 경로만 lineOrder 순서로 렌더링한다", () => {
  const lines = [
    routeLine(2, 2, [[129.1, 35.1], [129.2, 35.2]], "SUBWAY"),
    routeLine(1, 1, [[129, 35], [129.1, 35.1]]),
    routeLine(2, 1, [[129, 35]]),
  ];
  const selected = routeLinesForOrder(lines, 2);

  assert.deepEqual(selected.map((line) => line.lineOrder), [1, 2]);
  assert.deepEqual(renderableRouteLines(selected).map((line) => line.lineOrder), [2]);
});

test("좌표가 없는 경로는 polyline 후보를 만들지 않는다", () => {
  assert.deepEqual(renderableRouteLines([routeLine(1, 1, [])]), []);
  assert.deepEqual(renderableRouteLines([routeLine(1, 1, [[129, 35]])]), []);
});

test("도보만 있으면 즉흥여행 대중교통 패널을 숨긴다", () => {
  assert.equal(hasPublicTransit(transit(["WALK"])), false);
  assert.equal(hasPublicTransit(transit(["WALK", "BUS"])), true);
});

test("실제 좌표가 있는 두 번째 대중교통 구간부터 환승 마커를 만든다", () => {
  const lines = [
    routeLine(1, 1, [[129, 35], [129.1, 35.1]], "BUS"),
    routeLine(1, 2, [[129.1, 35.1], [129.2, 35.2]], "SUBWAY"),
  ];

  assert.deepEqual(transferPointsForRoute(lines), [
    {
      name: "환승 1",
      lat: 35.1,
      lng: 129.1,
      mode: "SUBWAY",
      lineName: null,
    },
  ]);
});

test("저장 재시도에는 기존 Idempotency-Key를 그대로 사용한다", () => {
  let generated = 0;
  const createKey = () => {
    generated += 1;
    return "new-key";
  };

  assert.equal(resolveSaveIdempotencyKey("retry-key", createKey), "retry-key");
  assert.equal(generated, 0);
  assert.equal(resolveSaveIdempotencyKey(null, createKey), "new-key");
  assert.equal(generated, 1);
});
