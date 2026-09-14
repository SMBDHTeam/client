"use client";

import { useState } from "react";
import {
  deleteComment,
  deletePost,
  getReportDetail,
  getReports,
  updateReportStatus,
} from "@/lib/api/admin";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import { FilterTabs, PageHeader } from "@/components/admin/ui";
import { Pager } from "@/components/admin/Pager";
import type { ReportStatus } from "@/types/api/admin";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: ReportStatus | ""; label: string }[] = [
  { value: "PENDING", label: "대기" },
  { value: "REVIEWING", label: "검토 중" },
  { value: "RESOLVED", label: "처리됨" },
  { value: "REJECTED", label: "반려" },
  { value: "", label: "전체" },
];

const STATUS_STYLE: Record<ReportStatus, string> = {
  PENDING: "bg-rose-100 text-rose-700",
  REVIEWING: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-zinc-200 text-zinc-600",
};

const TARGET_LABEL = { POST: "게시물", COMMENT: "댓글", USER: "사용자" } as const;

export default function AdminReportsPage() {
  // 대기 중인 것부터 본다. 처리할 게 있어서 들어오는 화면이다.
  const [status, setStatus] = useState<ReportStatus | "">("PENDING");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const list = useAdminQuery(
    () => getReports({ status: status || undefined, page, size: PAGE_SIZE }),
    `reports:${status}:${page}`,
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
                    <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[report.status]}`}>
                      {STATUS_FILTERS.find((f) => f.value === report.status)?.label ?? report.status}
                    </span>
                    <span className="text-[13px] text-zinc-500">
                      {TARGET_LABEL[report.targetType]} #{report.targetId}
                    </span>
                    <span className="ml-auto text-[13px] text-zinc-400">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-800">{report.reason}</p>
                  <p className="mt-1.5 text-[13px] text-zinc-400">
                    신고자 {report.reporter?.nickname ?? "(탈퇴)"}
                    {report.handledBy && ` · 처리 ${report.handledBy.nickname}`}
                  </p>
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setFailure(null);
    try {
      await action();
      onChanged();
    } catch {
      setFailure("처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  const report = detail.data?.report;
  const target = detail.data?.target;
  const deletable = report?.targetType === "POST" || report?.targetType === "COMMENT";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900">신고 #{reportId}</h2>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">
            닫기
          </button>
        </div>

        <div className="mt-4">
          <QueryState loading={detail.loading} error={detail.error} onRetry={detail.reload} />
        </div>

        {report && (
          <div className="mt-4 flex flex-col gap-4">
            <Field label="사유">{report.reason}</Field>
            <Field label="대상">
              {TARGET_LABEL[report.targetType]} #{report.targetId}
              {target?.deleted && (
                <span className="ml-2 text-xs text-zinc-400">이미 삭제됨</span>
              )}
            </Field>

            {target ? (
              <Field label="원본">
                <span className="whitespace-pre-wrap">{target.content || "(내용 없음)"}</span>
                {target.author && (
                  <span className="mt-1 block text-xs text-zinc-400">
                    작성자 {target.author.nickname}
                  </span>
                )}
              </Field>
            ) : (
              <Field label="원본">
                <span className="text-zinc-400">원본을 찾을 수 없습니다. 이미 삭제됐습니다.</span>
              </Field>
            )}

            {failure && <p className="text-sm text-rose-600">{failure}</p>}

            <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
              <p className="text-[13px] font-semibold text-zinc-500">상태 변경</p>
              <div className="flex flex-wrap gap-2">
                {(["REVIEWING", "RESOLVED", "REJECTED"] as ReportStatus[]).map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={busy || report.status === next}
                    onClick={() => run(() => updateReportStatus(reportId, next))}
                    className="h-8 rounded-lg bg-zinc-100 px-3 text-[13px] font-medium text-zinc-700 disabled:opacity-40"
                  >
                    {STATUS_FILTERS.find((f) => f.value === next)?.label}
                  </button>
                ))}
              </div>
            </div>

            {deletable && !target?.deleted && (
              <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
                <p className="text-[13px] font-semibold text-zinc-500">원본 삭제</p>
                {confirmingDelete ? (
                  // 되돌릴 수 없어서 한 번 더 묻는다.
                  <div className="flex flex-col gap-2 rounded-xl bg-rose-50 p-3">
                    <p className="text-[13px] leading-relaxed text-rose-700">
                      {TARGET_LABEL[report.targetType]} #{report.targetId} 을(를) 지웁니다.
                      되돌릴 수 없습니다.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            report.targetType === "POST"
                              ? deletePost(report.targetId)
                              : deleteComment(report.targetId),
                          )
                        }
                        className="h-8 rounded-lg bg-rose-600 px-3 text-[13px] font-semibold text-white disabled:opacity-40"
                      >
                        삭제한다
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        className="h-8 rounded-lg bg-white px-3 text-[13px] font-medium text-zinc-600 ring-1 ring-zinc-200"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="h-8 self-start rounded-lg px-3 text-[13px] font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                  >
                    원본 삭제
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-semibold text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-800">{children}</div>
    </div>
  );
}

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}
