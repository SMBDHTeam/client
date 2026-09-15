import apiClient from "./axios";
import type {
  CreateReportRequest,
  ReportCheckResponse,
  ReportResponse,
  ReportTargetType,
} from "@/types/api/report";

export async function createReport(body: CreateReportRequest): Promise<ReportResponse> {
  const { data } = await apiClient.post<ReportResponse>("/reports", body);
  return data;
}

/** 이 대상을 이미 신고했는지. 신고 시트를 열 때 먼저 확인한다. */
export async function getMyReportStatus(
  targetType: ReportTargetType,
  targetId: number,
): Promise<ReportCheckResponse> {
  const { data } = await apiClient.get<ReportCheckResponse>("/reports/me", {
    params: { targetType, targetId },
  });
  return data;
}
