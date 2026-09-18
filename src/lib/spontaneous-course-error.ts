import type { TransportMode } from "@/types/api/spontaneous-trip";

export type SpontaneousCourseFailure = {
  destinationId: string;
  destinationName: string;
  code: string;
  message: string;
};

export type SpontaneousCourseErrorPresentation = {
  title: string;
  description: string;
  guidance: string;
  kind: "conditions" | "service";
};

const SERVICE_ERROR_CODES = new Set([
  "TOUR_API_NOT_CONFIGURED",
  "TOUR_API_ERROR",
  "TMAP_QUOTA_EXCEEDED",
  "ODSAY_QUOTA_EXCEEDED",
  "ODSAY_AUTH_FAILED",
  "EXTERNAL_ROUTING_API_ERROR",
  "UNKNOWN_API_ERROR",
]);

export function getSpontaneousCourseErrorPresentation(
  failure: SpontaneousCourseFailure,
  transportMode: TransportMode,
): SpontaneousCourseErrorPresentation {
  const destination = failure.destinationName || "선택한 목적지";

  switch (failure.code) {
    case "SPONTANEOUS_COURSE_RETURN_TIME_EXCEEDED":
      return {
        title: "복귀 시간 안에 돌아오기 어려워요",
        description: `${destination} 코스의 이동과 방문 시간을 계산해 보니 설정한 복귀 시간을 넘어요.`,
        guidance: "더 가까운 목적지를 선택하거나 여행 시간을 늘려 주세요.",
        kind: "conditions",
      };
    case "SPONTANEOUS_COURSE_THEME_NOT_FEASIBLE":
      return {
        title: "선택한 테마를 모두 담기 어려워요",
        description: `${destination}에서 요청한 테마를 만족하는 장소 조합을 찾지 못했어요.`,
        guidance: "테마를 줄이거나 다른 목적지를 선택해 주세요.",
        kind: "conditions",
      };
    case "SPONTANEOUS_COURSE_PLACES_CLOSED":
      return {
        title: "지금 이용할 수 있는 장소가 부족해요",
        description: `${destination}의 방문 예정 시간에 영업 중인 장소만으로는 코스를 만들기 어려워요.`,
        guidance: "출발 시간을 앞당기거나 다른 목적지를 선택해 주세요.",
        kind: "conditions",
      };
    case "SPONTANEOUS_ROUTE_NOT_FOUND":
      return {
        title: "이동 가능한 경로를 찾지 못했어요",
        description: `${destination}의 장소들을 현재 이동수단으로 연결할 수 없어요.`,
        guidance: "다른 목적지나 이동수단을 선택해 주세요.",
        kind: "conditions",
      };
    case "SPONTANEOUS_COURSE_NOT_FEASIBLE":
      return {
        title: `${destination} 코스를 만들기 어려워요`,
        description:
          transportMode === "WALK"
            ? "도보 이동시간, 장소 영업시간, 복귀 시간을 모두 만족하는 코스를 찾지 못했어요."
            : "이동시간, 장소 영업시간, 복귀 시간을 모두 만족하는 코스를 찾지 못했어요.",
        guidance: "가까운 목적지를 선택하거나 여행 시간과 이동수단을 변경해 주세요.",
        kind: "conditions",
      };
    default:
      if (SERVICE_ERROR_CODES.has(failure.code)) {
        return {
          title: "코스 생성 서비스가 잠시 원활하지 않아요",
          description: "현재 서버 또는 경로 서비스에 일시적인 문제가 있어요.",
          guidance: "잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 관리자에게 알려 주세요.",
          kind: "service",
        };
      }

      return {
        title: "코스를 만드는 중 문제가 발생했어요",
        description: failure.message || "요청을 처리하는 중 예상하지 못한 문제가 발생했어요.",
        guidance: "다른 목적지를 선택하거나 잠시 후 다시 시도해 주세요.",
        kind: "service",
      };
  }
}
