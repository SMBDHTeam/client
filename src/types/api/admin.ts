/**
 * 관리자 API 응답 타입.
 *
 * 서버의 `com.server.admin.dto` 와 짝을 이룬다. 서버 DTO 가 바뀌면 여기도 함께 고친다.
 */

export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
export type ReportTargetType = "POST" | "COMMENT" | "USER";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
export type UserRole = "USER" | "ADMIN";
export type StatsMetric = "USERS" | "POSTS" | "SCHEDULES";

export type AdminActor = {
  id: number;
  nickname: string;
};

export type AdminReport = {
  id: number;
  reporter: AdminActor | null;
  targetType: ReportTargetType;
  targetId: number;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  /** 아직 처리 전이면 null */
  handledBy: AdminActor | null;
  handledAt: string | null;
};

export type AdminReportDetail = {
  report: AdminReport;
  /** 신고 대상 원본. 이미 삭제됐으면 null */
  target: {
    id: number;
    author: AdminActor | null;
    content: string | null;
    deleted: boolean;
  } | null;
};

export type AdminReportList = {
  items: AdminReport[];
  totalCount: number;
};

export type AdminUser = {
  id: number;
  nickname: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  suspendedUntil: string | null;
  suspendedReason: string | null;
  /** 지금 쓰기가 막혀 있는지. 기간이 지난 정지는 false 다 */
  writeBlocked: boolean;
  createdAt: string;
  deletedAt: string | null;
};

export type AdminUserList = {
  items: AdminUser[];
  totalCount: number;
};

export type AdminUserDetail = {
  user: AdminUser;
  postCount: number;
  reportsFiled: number;
  /** 이 사용자를 대상으로 접수된 신고 수. 조치 판단의 핵심이다 */
  reportsReceived: number;
};

export type AdminPlace = {
  id: number;
  name: string;
  address: string | null;
  source: string;
  hidden: boolean;
  hiddenAt: string | null;
  hiddenReason: string | null;
};

export type AdminPlaceList = {
  items: AdminPlace[];
  totalCount: number;
};

export type AdminIngestionStatus = {
  statusCounts: Record<string, number>;
  hiddenCount: number;
  ingestionEnabled: boolean;
  enrichmentEnabled: boolean;
  quotaDate: string;
  requestsUsed: number;
  dailyLimit: number;
  requestsRemaining: number;
};

/**
 * 수동 적재 결과.
 *
 * 적재 상태(`AdminIngestionStatus`) 와 다른 모양이다. 이쪽은 "이번 실행이 무엇을 했나"이고,
 * 저쪽은 "지금 전체가 어떤 상태인가"다. 실행 후 현황을 다시 그리려면 상태를 새로 조회해야 한다.
 */
export type AdminIngestionResult = {
  fetched: number;
  discovered: number;
  enriched: number;
  unchanged: number;
  pending: number;
  failed: number;
  skipped: number;
  apiRequests: number;
  /** 다른 적재가 진행 중이라 건너뛴 경우 true */
  lockSkipped: boolean;
};

export type AdminStatsMetricValue = {
  total: number;
  recent: number;
};

export type AdminStatsSummary = {
  days: number;
  users: AdminStatsMetricValue;
  posts: AdminStatsMetricValue;
  schedules: AdminStatsMetricValue;
  pendingReports: number;
  suspendedUsers: number;
  visiblePlaces: number;
};

export type AdminStatsTrend = {
  metric: string;
  points: { date: string; count: number }[];
};

export type AdminStatsPopular = {
  type: "PLACE" | "HASHTAG";
  /** 해시태그면 id 가 null 이다 */
  items: { id: number | null; name: string; count: number }[];
};
