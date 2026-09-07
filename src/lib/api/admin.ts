import type {
  AdminIngestionResult,
  AdminIngestionStatus,
  AdminPlace,
  AdminPlaceList,
  AdminReportDetail,
  AdminReportList,
  AdminStatsPopular,
  AdminStatsSummary,
  AdminStatsTrend,
  AdminUserDetail,
  AdminUserList,
  ReportStatus,
  ReportTargetType,
  StatsMetric,
  UserStatus,
} from "@/types/api/admin";
import apiClient from "./axios";

/**
 * 관리자 API.
 *
 * 모든 경로가 ADMIN 권한을 요구한다. 토큰은 `axios.ts` 의 요청 인터셉터가 붙이므로
 * 여기서 다루지 않는다.
 *
 * <p>값이 undefined 인 params 는 axios 가 알아서 뺀다. 직접 쿼리 문자열을 만들면
 * "?status=undefined" 같은 것이 섞인다.
 */

// 신고

export async function getReports(params: {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  page?: number;
  size?: number;
} = {}) {
  const { data } = await apiClient.get<AdminReportList>("/admin/reports", { params });
  return data;
}

export async function getReportDetail(reportId: number) {
  const { data } = await apiClient.get<AdminReportDetail>(`/admin/reports/${reportId}`);
  return data;
}

export async function updateReportStatus(reportId: number, status: ReportStatus) {
  const { data } = await apiClient.patch<AdminReportDetail["report"]>(
    `/admin/reports/${reportId}`,
    { status },
  );
  return data;
}

/** 게시물을 지운다. 되돌릴 수 없다. */
export async function deletePost(postId: number) {
  await apiClient.delete(`/admin/posts/${postId}`);
}

export async function deleteComment(commentId: number) {
  await apiClient.delete(`/admin/comments/${commentId}`);
}

// 사용자

export async function getUsers(params: {
  keyword?: string;
  status?: UserStatus;
  page?: number;
  size?: number;
} = {}) {
  const { data } = await apiClient.get<AdminUserList>("/admin/users", { params });
  return data;
}

export async function getUserDetail(userId: number) {
  const { data } = await apiClient.get<AdminUserDetail>(`/admin/users/${userId}`);
  return data;
}

/**
 * 정지하거나 푼다.
 *
 * `days` 를 생략하면 기한 없는 정지다. 해제할 때는 `days` 와 `reason` 을 보내지 않는다.
 */
export async function updateUserStatus(
  userId: number,
  body: { suspended: boolean; days?: number; reason?: string },
) {
  const { data } = await apiClient.patch<AdminUserDetail["user"]>(
    `/admin/users/${userId}/status`,
    body,
  );
  return data;
}

// 장소

/**
 * 등록된 장소 검색.
 *
 * 공개 검색(`/places`)을 쓰지 않는다. 그쪽은 가려 둔 장소를 결과에서 빼기 때문에
 * 관리 화면에서 되돌릴 대상을 찾을 수 없고, 이름만 보므로 주소로 찾을 수 없다.
 *
 * @param hidden 생략하면 전부, true 면 가린 것만, false 면 노출 중인 것만
 */
export async function getPlaces(params: {
  keyword?: string;
  hidden?: boolean;
  page?: number;
  size?: number;
} = {}) {
  const { data } = await apiClient.get<AdminPlaceList>("/admin/places", { params });
  return data;
}

export async function updatePlaceHidden(
  placeId: number,
  body: { hidden: boolean; reason?: string },
) {
  const { data } = await apiClient.patch<AdminPlace>(
    `/admin/places/${placeId}/hidden`,
    body,
  );
  return data;
}

export async function getIngestionStatus() {
  const { data } = await apiClient.get<AdminIngestionStatus>("/admin/places/ingestion");
  return data;
}

/**
 * 수동 적재. TourAPI 하루 예산을 쓰므로 남은 호출 수를 먼저 확인한다.
 *
 * 응답은 이번 실행의 결과이지 현황이 아니다. 화면을 갱신하려면 `getIngestionStatus` 를
 * 다시 불러야 한다.
 */
export async function runIngestion() {
  const { data } = await apiClient.post<AdminIngestionResult>("/admin/places/ingestion");
  return data;
}

// 통계

export async function getStatsSummary(days?: number) {
  const { data } = await apiClient.get<AdminStatsSummary>("/admin/stats/summary", {
    params: { days },
  });
  return data;
}

export async function getStatsTrend(metric: StatsMetric, days?: number) {
  const { data } = await apiClient.get<AdminStatsTrend>("/admin/stats/trend", {
    params: { metric, days },
  });
  return data;
}

export async function getStatsPopular(type: "PLACE" | "HASHTAG", size?: number) {
  const { data } = await apiClient.get<AdminStatsPopular>("/admin/stats/popular", {
    params: { type, size },
  });
  return data;
}
