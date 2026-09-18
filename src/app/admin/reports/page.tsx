"use client";

import { useState } from "react";
import {
  deleteComment,
  deletePost,
  getReportDetail,
  getReports,
  updateReportStatus,
  updateUserStatus,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/axios";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import { Badge, Button, FilterTabs, PageHeader, TextInput } from "@/components/admin/ui";
import { Pager } from "@/components/admin/Pager";
import type { AdminReportDetail, ReportStatus } from "@/types/api/admin";
import { REPORT_REASON_LABEL, REPORT_REASONS, type ReportReasonType } from "@/types/api/report";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: ReportStatus | ""; label: string }[] = [
  { value: "PENDING", label: "대기" },
  { value: "REVIEWING", label: "검토 중" },
  { value: "RESOLVED", label: "처리됨" },
  { value: "REJECTED", label: "반려" },
  { value: "", label: "전체" },
];

const STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: "대기",
  REVIEWING: "검토 중",
  RESOLVED: "처리됨",
  REJECTED: "반려",
};

const STATUS_TONE: Record<ReportStatus, "bad" | "warn" | "good" | "neutral"> = {
  PENDING: "bad",
  REVIEWING: "warn",
  RESOLVED: "good",
  REJECTED: "neutral",
};

const TARGET_LABEL = { POST: "게시물", COMMENT: "댓글", USER: "사용자" } as const;

/** 정지 기간 선택지. 비워 두면 기한 없는 정지다. */
const SUSPEND_DAYS: { value: number | null; label: string }[] = [
  { value: 1, label: "1일" },
  { value: 7, label: "7일" },
  { value: 30, label: "30일" },
  { value: null, label: "기한 없음" },
];

function isOpen(status: ReportStatus) {
  return status === "PENDING" || status === "REVIEWING";
}

export default function AdminReportsPage() {
  // 대기 중인 것부터 본다. 처리할 게 있어서 들어오는 화면이다.
  const [status, setStatus] = useState<ReportStatus | "">("PENDING");
  const [reasonType, setReasonType] = useState<ReportReasonType | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const list = useAdminQuery(
    () =>
      getReports({
        status: status || undefined,
        reasonType: reasonType || undefined,
        page,
        size: PAGE_SIZE,
      }),
    `reports:${status}:${reasonType}:${page}`,
  );

  const lastPage = list.data ? Math.max(Math.ceil(list.data.totalCount / PAGE_SIZE) - 1, 0) : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="신고"
        description="처리할 것부터 본다"
        action={
          <FilterTabs
            options={STATUS_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
          />
        }
      />

      <FilterTabs
        options={[
          { value: "" as ReportReasonType | "", label: "모든 사유" },
          ...REPORT_REASONS.map((reason) => ({ value: reason.value as ReportReasonType | "", label: reason.label })),
        ]}
        value={reasonType}
        onChange={(value) => {
          setReasonType(value);
          setPage(0);
        }}
      />

      <QueryState
        loading={list.loading}
        error={list.error}
        empty={list.data?.items.length === 0}
        emptyText="해당하는 신고가 없습니다."
        onRetry={list.reload}
      />

      {list.data && list.data.items.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {list.data.items.map((report) => (
              <li key={report.id}>
                <button
                  type="button"
                  onClick={() => setSelected(report.id)}
                  className="w-full rounded-2xl bg-white p-5 text-left ring-1 ring-black/5 transition-colors hover:bg-zinc-50"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Badge>
                    <span className="text-[13px] text-zinc-500">
                      {TARGET_LABEL[report.targetType]} #{report.targetId}
                    </span>
                    <span className="ml-auto text-[13px] text-zinc-400">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">
                    {REPORT_REASON_LABEL[report.reasonType] ?? report.reasonType}
                  </p>
                  {report.reason && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-700">{report.reason}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <p className="text-[13px] text-zinc-400">
                      신고자 {report.reporter?.nickname ?? "(탈퇴)"}
                      {report.handledBy && ` · 처리 ${report.handledBy.nickname}`}
                    </p>
                    {isOpen(report.status) && (
                      <span className="ml-auto text-[13px] font-semibold text-zinc-900">처리하기 →</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <Pager page={page} lastPage={lastPage} total={list.data.totalCount} onChange={setPage} />
        </>
      )}

      {selected !== null && (
        <ReportDetailSheet
          reportId={selected}
          onClose={() => setSelected(null)}
          onChanged={() => {
            list.reload();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

type Pending = "delete" | "suspend" | null;

function ReportDetailSheet({
  reportId,
  onClose,
  onChanged,
}: {
  reportId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const detail = useAdminQuery(() => getReportDetail(reportId), `report:${reportId}`);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  // 되돌릴 수 없는 조치는 버튼을 한 번 더 확인한 뒤에 실행한다.
  const [pending, setPending] = useState<Pending>(null);

  const report = detail.data?.report;
  const target = detail.data?.target;

  async function changeStatus(next: ReportStatus) {
    setBusy(true);
    setFailure(null);
    try {
      await updateReportStatus(reportId, next);
      onChanged();
    } catch {
      setFailure("상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * 조치와 처리 완료를 한 번에 한다.
   *
   * 조치는 됐는데 상태 변경만 실패하면, 같은 조치를 다시 누르지 않도록 무엇이 남았는지 알려준다.
   */
  async function actAndResolve(action: () => Promise<unknown>, doneLabel: string) {
    setBusy(true);
    setFailure(null);
    try {
      await action();
    } catch (err) {
      setFailure(actionFailureMessage(err));
      setBusy(false);
      return;
    }
    try {
      await updateReportStatus(reportId, "RESOLVED");
      onChanged();
    } catch {
      setFailure(`${doneLabel}. 신고 상태만 바꾸지 못했습니다. 아래 "조치 없이 처리 완료"를 눌러 마무리해 주세요.`);
      setPending(null);
      detail.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-bold text-zinc-900">신고 #{reportId}</h2>
          {report && <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Badge>}
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
            닫기
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <QueryState loading={detail.loading} error={detail.error} onRetry={detail.reload} />

          {report && (
            <div className="flex flex-col gap-5">
              <Section title="신고 내용">
                <p className="text-base font-bold text-zinc-900">
                  {REPORT_REASON_LABEL[report.reasonType] ?? report.reasonType}
                </p>
                {report.reason && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{report.reason}</p>
                )}
                <p className="mt-2 text-[13px] text-zinc-400">
                  신고자 {report.reporter?.nickname ?? "(탈퇴)"} · {formatDate(report.createdAt)}
                </p>
              </Section>

              <Section title={`대상 · ${TARGET_LABEL[report.targetType]} #${report.targetId}`}>
                <TargetPreview report={report} target={target ?? null} />
              </Section>

              {report.handledBy && (
                <Section title="처리 이력">
                  <p className="text-sm text-zinc-700">
                    {report.handledBy.nickname}
                    {report.handledAt && ` · ${formatDate(report.handledAt)}`} · {STATUS_LABEL[report.status]}
                  </p>
                </Section>
              )}
            </div>
          )}
        </div>

        {report && (
          <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-4">
            {failure && (
              <p className="mb-3 rounded-xl bg-rose-50 p-3 text-[13px] leading-relaxed text-rose-700">{failure}</p>
            )}

            {isOpen(report.status) ? (
              <OpenActions
                report={report}
                target={target ?? null}
                busy={busy}
                pending={pending}
                onPending={setPending}
                onChangeStatus={changeStatus}
                onActAndResolve={actAndResolve}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-zinc-600">
                  이미 <strong className="text-zinc-900">{STATUS_LABEL[report.status]}</strong> 상태입니다.
                  잘못 처리했다면 대기로 되돌려 다시 판단할 수 있습니다.
                </p>
                <Button variant="secondary" disabled={busy} onClick={() => changeStatus("PENDING")}>
                  대기로 되돌리기
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OpenActions({
  report,
  target,
  busy,
  pending,
  onPending,
  onChangeStatus,
  onActAndResolve,
}: {
  report: AdminReportDetail["report"];
  target: AdminReportDetail["target"];
  busy: boolean;
  pending: Pending;
  onPending: (next: Pending) => void;
  onChangeStatus: (next: ReportStatus) => void;
  onActAndResolve: (action: () => Promise<unknown>, doneLabel: string) => void;
}) {
  const [days, setDays] = useState<number | null>(7);
  const [suspendReason, setSuspendReason] = useState(
    `신고: ${REPORT_REASON_LABEL[report.reasonType] ?? report.reasonType}`,
  );

  const targetAlive = target != null && !target.deleted;
  const canDelete = targetAlive && (report.targetType === "POST" || report.targetType === "COMMENT");
  const canSuspend = targetAlive && report.targetType === "USER";
  const targetLabel = TARGET_LABEL[report.targetType];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-zinc-900">처리</p>
        {report.status === "PENDING" && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onChangeStatus("REVIEWING")}>
            검토 중으로 표시
          </Button>
        )}
      </div>

      {canDelete &&
        (pending === "delete" ? (
          <div className="flex flex-col gap-2 rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200">
            <p className="text-[13px] leading-relaxed text-rose-700">
              {targetLabel} #{report.targetId}을(를) 지우고 신고를 처리 완료로 바꿉니다. 지운 원본은 작성자가 되살릴 수 없습니다.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={busy}
                onClick={() =>
                  onActAndResolve(
                    () => (report.targetType === "POST" ? deletePost(report.targetId) : deleteComment(report.targetId)),
                    `${targetLabel}은(는) 지웠습니다`,
                  )
                }
              >
                {busy ? "처리 중..." : "삭제하고 처리 완료"}
              </Button>
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => onPending(null)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <ActionButton
            variant="danger"
            title={`${targetLabel} 삭제하고 처리 완료`}
            description="신고 사유에 해당해 원본을 내린다"
            disabled={busy || pending !== null}
            onClick={() => onPending("delete")}
          />
        ))}

      {canSuspend &&
        (pending === "suspend" ? (
          <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
            <p className="text-[13px] font-semibold text-amber-800">정지 기간</p>
            <div className="flex flex-wrap gap-1.5">
              {SUSPEND_DAYS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={days === option.value}
                  onClick={() => setDays(option.value)}
                  className={`h-8 rounded-lg px-3 text-[13px] font-medium ring-1 transition-colors ${
                    days === option.value
                      ? "bg-amber-600 text-white ring-amber-600"
                      : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <TextInput
              value={suspendReason}
              onChange={(event) => setSuspendReason(event.target.value)}
              maxLength={500}
              placeholder="정지 사유"
            />
            <p className="text-[12px] text-amber-800">정지되면 글·댓글 쓰기가 막히고, 읽기는 그대로 열려 있습니다.</p>
            <div className="flex gap-2">
              <Button
                variant="caution"
                size="sm"
                disabled={busy || !suspendReason.trim()}
                onClick={() =>
                  onActAndResolve(
                    () =>
                      updateUserStatus(report.targetId, {
                        suspended: true,
                        days: days ?? undefined,
                        reason: suspendReason.trim(),
                      }),
                    "사용자는 정지했습니다",
                  )
                }
              >
                {busy ? "처리 중..." : "정지하고 처리 완료"}
              </Button>
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => onPending(null)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <ActionButton
            variant="caution"
            title="사용자 정지하고 처리 완료"
            description="기간과 사유를 정해 쓰기를 막는다"
            disabled={busy || pending !== null}
            onClick={() => onPending("suspend")}
          />
        ))}

      <ActionButton
        variant="primary"
        title={targetAlive ? "조치 없이 처리 완료" : "처리 완료"}
        description={targetAlive ? "확인은 했지만 원본은 그대로 둔다" : "원본이 이미 사라져 더 할 조치가 없다"}
        disabled={busy || pending !== null}
        onClick={() => onChangeStatus("RESOLVED")}
      />
      <ActionButton
        variant="secondary"
        title="반려"
        description="신고 사유에 해당하지 않는다"
        disabled={busy || pending !== null}
        onClick={() => onChangeStatus("REJECTED")}
      />
    </div>
  );
}

/** 결정 버튼. 무엇을 하는지와 언제 고르는지를 함께 보여준다. */
function ActionButton({
  variant,
  title,
  description,
  disabled,
  onClick,
}: {
  variant: "primary" | "secondary" | "danger" | "caution";
  title: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const TONE = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-700",
    secondary: "bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    caution: "bg-amber-600 text-white hover:bg-amber-500",
  } as const;
  const SUB = {
    primary: "text-white/70",
    secondary: "text-zinc-500",
    danger: "text-white/80",
    caution: "text-white/80",
  } as const;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full flex-col items-start rounded-xl px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${TONE[variant]}`}
    >
      <span className="text-sm font-semibold">{title}</span>
      <span className={`mt-0.5 text-[12px] ${SUB[variant]}`}>{description}</span>
    </button>
  );
}

function TargetPreview({
  report,
  target,
}: {
  report: AdminReportDetail["report"];
  target: AdminReportDetail["target"];
}) {
  if (!target) {
    return <p className="text-sm text-zinc-400">원본을 찾을 수 없습니다. 이미 정리됐습니다.</p>;
  }
  return (
    <div className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
      {target.deleted && (
        <div className="mb-2">
          <Badge tone="neutral">{report.targetType === "USER" ? "탈퇴함" : "이미 삭제됨"}</Badge>
        </div>
      )}
      <p className="whitespace-pre-wrap text-sm text-zinc-800">{target.content || "(내용 없음)"}</p>
      {target.author && report.targetType !== "USER" && (
        <p className="mt-2 text-[13px] text-zinc-400">작성자 {target.author.nickname}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-1.5 text-[13px] font-semibold text-zinc-500">{title}</p>
      {children}
    </section>
  );
}

function actionFailureMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.payload.code === "CANNOT_SUSPEND_ADMIN") return "관리자는 정지할 수 없습니다. 먼저 역할을 사용자로 바꿔야 합니다.";
    if (err.status === 404) return "대상이 이미 사라졌습니다. 목록을 새로 고친 뒤 다시 확인해 주세요.";
  }
  return "조치하지 못했습니다. 신고 상태는 그대로입니다. 잠시 후 다시 시도해 주세요.";
}

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}
