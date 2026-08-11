import type { TripQuestionsResponse } from "@/types/api/question";
import { requestJson } from "./client";

let questionsRequest: Promise<TripQuestionsResponse> | null = null;

export function getTripQuestions() {
  if (!questionsRequest) {
    questionsRequest = requestJson<TripQuestionsResponse>("/trip-questions");
    questionsRequest.catch(() => { questionsRequest = null; });
  }
  return questionsRequest;
}
