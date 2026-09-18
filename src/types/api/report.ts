/**
 * 신고 API 타입. 서버의 `com.server.report.dto` 와 짝을 이룬다.
 */

export type ReportTargetType = "POST" | "COMMENT" | "USER";

export type ReportReasonType =
  | "SPAM"
  | "ABUSE"
  | "SEXUAL"
  | "ILLEGAL"
  | "PRIVACY"
  | "FALSE_INFO"
  | "OTHER";

/** 화면에 보여줄 순서. `OTHER` 는 마지막에 둔다. */
export const REPORT_REASONS: { value: ReportReasonType; label: string }[] = [
  { value: "SPAM", label: "스팸·광고" },
  { value: "ABUSE", label: "욕설·비하·괴롭힘" },
  { value: "SEXUAL", label: "음란하거나 선정적인 내용" },
  { value: "ILLEGAL", label: "불법이거나 위험한 내용" },
  { value: "PRIVACY", label: "개인정보 노출" },
  { value: "FALSE_INFO", label: "잘못된 장소·여행 정보" },
  { value: "OTHER", label: "기타" },
];

export const REPORT_REASON_LABEL = Object.fromEntries(
  REPORT_REASONS.map((reason) => [reason.value, reason.label]),
) as Record<ReportReasonType, string>;

export type CreateReportRequest = {
  targetType: ReportTargetType;
  targetId: number;
  reasonType: ReportReasonType;
  /** `OTHER` 일 때만 필수. 최대 500자 */
  reason?: string;
};

export type ReportResponse = {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reasonType: ReportReasonType;
  status: string;
  createdAt: string;
};

/** 내가 이 대상을 이미 신고했는지 */
export type ReportCheckResponse = {
  reported: boolean;
};
