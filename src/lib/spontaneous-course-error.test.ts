import assert from "node:assert/strict";
import test from "node:test";
import { getSpontaneousCourseErrorPresentation } from "./spontaneous-course-error.ts";

const baseFailure = {
  destinationId: "BUSAN_HAEUNDAE",
  destinationName: "해운대·청사포",
  message: "코스를 만들 수 없습니다.",
};

test("generic feasibility errors explain that walking conditions could not be satisfied", () => {
  const result = getSpontaneousCourseErrorPresentation(
    { ...baseFailure, code: "SPONTANEOUS_COURSE_NOT_FEASIBLE" },
    "WALK",
  );

  assert.equal(result.kind, "conditions");
  assert.match(result.title, /해운대/);
  assert.match(result.description, /도보 이동시간/);
});

test("closed-place errors recommend changing the departure time", () => {
  const result = getSpontaneousCourseErrorPresentation(
    { ...baseFailure, code: "SPONTANEOUS_COURSE_PLACES_CLOSED" },
    "CAR",
  );

  assert.equal(result.kind, "conditions");
  assert.match(result.title, /이용할 수 있는 장소/);
  assert.match(result.guidance, /출발 시간/);
});

test("provider failures are clearly identified as service errors", () => {
  const result = getSpontaneousCourseErrorPresentation(
    { ...baseFailure, code: "TMAP_QUOTA_EXCEEDED" },
    "WALK",
  );

  assert.equal(result.kind, "service");
  assert.match(result.title, /서비스/);
});
