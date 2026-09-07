"use client";

import { useEffect, useState } from "react";
import { getUserDetail, getUsers, updateUserStatus } from "@/lib/api/admin";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import { Pager } from "@/components/admin/Pager";
import type { UserStatus } from "@/types/api/admin";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: UserStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "정상" },
  { value: "SUSPENDED", label: "정지" },
  { value: "WITHDRAWN", label: "탈퇴" },
];

export default function AdminUsersPage() {
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  // 타이핑마다 부르지 않는다. 관리자 목록은 결과가 커서 매 글자 조회가 비싸다.
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const list = useAdminQuery(
    () =>
      getUsers({
        keyword: keyword || undefined,
        status: status || undefined,
        page,
        size: PAGE_SIZE,
      }),
    `users:${keyword}:${status}:${page}`,
  );

  const lastPage = list.data ? Math.max(Math.ceil(list.data.totalCount / PAGE_SIZE) - 1, 0) : 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-zinc-900">사용자</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          placeholder="닉네임 또는 이메일"
          className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/5 outline-none focus:ring-[#2E7DF2]"
        />
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => {
                setStatus(filter.value);
                setPage(0);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                filter.value === status ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <QueryState
        loading={list.loading}
        error={list.error}
        empty={list.data?.items.length === 0}
        emptyText="해당하는 사용자가 없습니다."
        onRetry={list.reload}
      />

      {list.data && list.data.items.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {list.data.items.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => setSelected(user.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left ring-1 ring-black/5 hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-zinc-900">
                      {user.nickname}
                      {user.role === "ADMIN" && (
                        <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          관리자
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-zinc-400">{user.email}</p>
                  </div>
                  <StatusBadge user={user} />
                </button>
              </li>
            ))}
          </ul>

          <Pager page={page} lastPage={lastPage} total={list.data.totalCount} onChange={setPage} />
        </>
      )}

      {selected !== null && (
        <UserDetailSheet
          userId={selected}
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

function StatusBadge({
  user,
}: {
  user: { status: UserStatus; writeBlocked: boolean };
}) {
  if (user.status === "WITHDRAWN") {
    return <Tag className="bg-zinc-200 text-zinc-600">탈퇴</Tag>;
  }
  if (user.status === "SUSPENDED") {
    // 기간이 지난 정지는 서버가 writeBlocked=false 로 준다. 상태만 보면 실제와 다르다.
    return user.writeBlocked ? (
      <Tag className="bg-rose-100 text-rose-700">정지</Tag>
    ) : (
      <Tag className="bg-amber-100 text-amber-700">정지 만료</Tag>
    );
  }
  return <Tag className="bg-emerald-100 text-emerald-700">정상</Tag>;
}

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

function UserDetailSheet({
  userId,
  onClose,
  onChanged,
}: {
  userId: number;
  onClose: () => void;
  onChanged: () => void;
}) {
  const detail = useAdminQuery(() => getUserDetail(userId), `user:${userId}`);
  const [days, setDays] = useState("7");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const user = detail.data?.user;

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900">사용자 #{userId}</h2>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">
            닫기
          </button>
        </div>

        <div className="mt-4">
          <QueryState loading={detail.loading} error={detail.error} onRetry={detail.reload} />
        </div>

        {detail.data && user && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                {user.nickname}
                <StatusBadge user={user} />
              </p>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Metric label="게시물" value={detail.data.postCount} />
              <Metric label="접수한 신고" value={detail.data.reportsFiled} />
              <Metric
                label="받은 신고"
                value={detail.data.reportsReceived}
                urgent={detail.data.reportsReceived > 0}
              />
            </div>

            {user.status === "SUSPENDED" && (
              <div className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
                <p>사유: {user.suspendedReason || "(없음)"}</p>
                <p className="mt-0.5">
                  만료: {user.suspendedUntil ? formatDate(user.suspendedUntil) : "기한 없음"}
                </p>
              </div>
            )}

            {failure && <p className="text-sm text-rose-600">{failure}</p>}

            <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4">
              {user.writeBlocked ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => updateUserStatus(userId, { suspended: false }))}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                >
                  정지 해제
                </button>
              ) : (
                <>
                  <p className="text-xs font-medium text-zinc-500">쓰기 정지</p>
                  <div className="flex gap-2">
                    <input
                      value={days}
                      onChange={(event) => setDays(event.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="일수"
                      className="w-20 rounded-xl bg-zinc-50 px-3 py-2 text-sm ring-1 ring-black/5 outline-none"
                    />
                    <input
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="사유"
                      maxLength={500}
                      className="min-w-0 flex-1 rounded-xl bg-zinc-50 px-3 py-2 text-sm ring-1 ring-black/5 outline-none"
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    일수를 비우면 기한 없는 정지가 됩니다. 정지돼도 읽기는 열려 있습니다.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        updateUserStatus(userId, {
                          suspended: true,
                          days: days ? Number(days) : undefined,
                          reason: reason.trim() || undefined,
                        }),
                      )
                    }
                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
                  >
                    정지
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  urgent,
}: {
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className={`text-lg font-bold ${urgent ? "text-rose-600" : "text-zinc-900"}`}>
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}
