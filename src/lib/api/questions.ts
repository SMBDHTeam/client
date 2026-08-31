import type { TripQuestionsResponse } from "@/types/api/question";
import apiClient from "./axios";

let questionsRequest: Promise<TripQuestionsResponse> | null = null;

export function getTripQuestions() {
  if (!questionsRequest) {
    questionsRequest = apiClient.get<TripQuestionsResponse>("/trip-questions").then((res) => res.data);
    questionsRequest.catch(() => { questionsRequest = null; });
  }
  return questionsRequest;
}
