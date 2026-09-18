"use client";

import { useState } from "react";
import { getAdminActions } from "@/lib/api/admin";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import { FilterTabs, PageHeader } from "@/components/admin/ui";
import { Pager } from "@/components/admin/Pager";
import type { AdminAction, AdminActionTargetType } from "@/types/api/admin";

const PAGE_SIZE = 20;

const FILTERS: { value: AdminActionTargetType | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "USER", label: "사용자" },
  { value: "POST", label: "게시물" },
  { value: "COMMENT", label: "댓글" },
  { value: "REPORT", label: "신고" },
  { value: "PLACE", label: "장소" },
  { value: "SYSTEM", label: "시스템" },
];

/** 무슨 일이 있었는지 한눈에 읽히게 한다. enum 이름을 그대로 두면 매번 해석해야 한다. */
const ACTION_LABEL: Record<AdminAction["action"], string> = {
  REPORT_STATUS_CHANGED: "신고 상태 변경",
  POST_DELETED: "게시물 삭제",
  COMMENT_DELETED: "댓글 삭제",
  USER_SUSPENDED: "사용자 정지",
  USER_SUSPENSION_RELEASED: "정지 해제",
  USER_ROLE_CHANGED: "역할 변경",
  PLACE_HIDDEN: "장소 숨김",
  PLACE_UNHIDDEN: "숨김 해제",
  INGESTION_RUN: "수동 적재",
};

/** 되돌릴 수 없거나 영향이 큰 조치는 눈에 띄어야 한다. */
const SEVERE: AdminAction["action"][] = [
  "POST_DELETED",
  "COMMENT_DELETED",
  "USER_SUSPENDED",
  "USER_ROLE_CHANGED",
  "INGESTION_RUN",
];

const TARGET_LABEL: Record<AdminActionTargetType, string> = {
  REPORT: "신고",
  POST: "게시물",
  COMMENT: "댓글",
  USER: "사용자",
  PLACE: "장소",
  SYSTEM: "시스템",
};

export default function AdminActionsPage() {
  const [targetType, setTargetType] = useState<AdminActionTargetType | "">("");
  const [page, setPage] = useState(0);

  const list = useAdminQuery(
    () =>
      getAdminActions({
        targetType: targetType || undefined,
        page,
        size: PAGE_SIZE,
      }),
    `actions:${targetType}:${page}`,
  );

  const lastPage = list.data ? Math.max(Math.ceil(list.data.totalCount / PAGE_SIZE) - 1, 0) : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="조치 이력"
        description="누가 언제 무엇을 왜 했는지. 기록은 수정하거나 지울 수 없습니다."
      />

      <FilterTabs
        options={FILTERS.map((f) => ({ value: f.value, label: f.label }))}
        value={targetType}
        onChange={(value) => {
          setTargetType(value);
          setPage(0);
        }}
      />

      <QueryState
        loading={list.loading}
        error={list.error}
        empty={list.data?.items.length === 0}
        emptyText="아직 기록된 조치가 없습니다."
        onRetry={list.reload}
      />

      {list.data && list.data.items.length > 0 && (
        <>
          <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
            {list.data.items.map((action) => (
              <li
                key={action.id}
                className="flex gap-3 border-b border-zinc-100 px-4 py-3.5 last:border-0"
              >
                {/* 심각한 조치에만 표시를 준다. 전부 칠하면 아무것도 안 보인다. */}
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    SEVERE.includes(action.action) ? "bg-rose-500" : "bg-zinc-300"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                    <span className="font-medium text-zinc-900">
                      {ACTION_LABEL[action.action]}
                    </span>
                    {action.targetId !== null && (
                      <span className="text-[13px] text-zinc-400">
                        {TARGET_LABEL[action.targetType]} #{action.targetId}
                      </span>
                    )}
                  </p>
                  {action.reason && (
                    <p className="mt-0.5 text-sm text-zinc-600">사유: {action.reason}</p>
                  )}
                  {action.detail && (
                    <p className="mt-1 truncate text-[13px] text-zinc-400">{action.detail}</p>
                  )}
                  <p className="mt-1.5 text-[13px] text-zinc-400">
                    {action.admin.nickname ?? `사용자 #${action.admin.id}`}
                    {" · "}
                    {formatDateTime(action.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Pager page={page} lastPage={lastPage} total={list.data.totalCount} onChange={setPage} />
        </>
      )}
    </div>
  );
}

function formatDateTime(value: string) {
  return value.slice(0, 16).replace("T", " ");
}
