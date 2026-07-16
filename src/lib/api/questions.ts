import type { TripQuestionsResponse } from "@/types/api/question";
import { assertScheduleV2Available, scheduleV2Mode } from "./config";
import { mockGetTripQuestions } from "./mock-schedule-v2";
import { requestJson } from "./client";

let questionsRequest: Promise<TripQuestionsResponse> | null = null;

export function getTripQuestions() {
  assertScheduleV2Available();
  if (!questionsRequest) {
    questionsRequest =
      scheduleV2Mode === "mock"
        ? mockGetTripQuestions()
        : requestJson<TripQuestionsResponse>("/trip-questions");
    questionsRequest.catch(() => {
      questionsRequest = null;
    });
  }
  return questionsRequest;
}
