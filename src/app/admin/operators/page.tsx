"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getUsers, updateUserRole } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/axios";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import { Badge, Button, PageHeader, TextInput } from "@/components/admin/ui";
import type { AdminUser, UserRole } from "@/types/api/admin";

type Pending = { user: AdminUser; next: UserRole } | null;
type Notice = { tone: "good" | "bad"; text: string } | null;

/**
 * 운영자 관리.
 *
 * 사용자 제재와 화면을 나눈다. 권한 변경은 드물고 되돌리기 번거로워, 제재하러 들어온 화면에서
 * 잘못 누르지 않게 한다. 반대로 권한을 바꾸는 사람은 신고 수나 정지 입력을 볼 필요가 없다.
 */
export default function AdminOperatorsPage() {
  const { data: session } = useSession();
  const myId = session?.user?.id != null ? Number(session.user.id) : null;

  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  // 권한을 바꾼 뒤 두 목록을 함께 다시 읽는다.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(keywordInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const admins = useAdminQuery(
    () => getUsers({ role: "ADMIN", size: 100 }),
    `operators:admins:${version}`,
  );
  const candidates = useAdminQuery(
    () =>
      keyword
        ? getUsers({ keyword, role: "USER", status: "ACTIVE", size: 10 })
        : Promise.resolve({ items: [], totalCount: 0 }),
    `operators:candidates:${keyword}:${version}`,
  );

  function ask(user: AdminUser, next: UserRole) {
    setNotice(null);
    setPending({ user, next });
  }

  async function apply() {
    if (!pending) return;
    const { user, next } = pending;
    setBusy(true);
    setNotice(null);
    try {
      await updateUserRole(user.id, next);
      setNotice({
        tone: "good",
        text:
          next === "ADMIN"
            ? `${user.nickname} 님을 관리자로 지정했습니다. 다시 로그인하면 반영됩니다.`
            : `${user.nickname} 님을 일반 사용자로 바꿨습니다. 다시 로그인하면 반영됩니다.`,
      });
      setPending(null);
      setVersion((value) => value + 1);
    } catch (err) {
      const code = err instanceof ApiError ? err.payload.code : null;
      setNotice({
        tone: "bad",
        text:
          code === "CANNOT_DEMOTE_LAST_ADMIN"
            ? "마지막 관리자는 일반 사용자로 바꿀 수 없습니다. 다른 사람을 먼저 관리자로 지정하세요."
            : "권한을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="운영자" description="관리자 권한 지정과 해제" />

      <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
        권한을 바꾸면 그 사람은 모든 기기에서 로그아웃되고, 다시 로그인해야 새 권한이 적용됩니다.
        글쓰기 정지 같은 제재는 사용자 화면에서 합니다.
      </div>

      {notice && (
        <p
          className={`rounded-xl p-3 text-sm ${
            notice.tone === "good" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {notice.text}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-zinc-900">
          현재 관리자
          {admins.data && <span className="ml-1.5 text-zinc-400">{admins.data.totalCount}</span>}
        </h2>
        <QueryState
          loading={admins.loading}
          error={admins.error}
          empty={admins.data?.items.length === 0}
          emptyText="관리자가 없습니다."
          onRetry={admins.reload}
        />
        {admins.data && admins.data.items.length > 0 && (
          <ul className="flex flex-col gap-2">
            {admins.data.items.map((user) => (
              <li key={user.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <OperatorRow
                  user={user}
                  me={user.id === myId}
                  pendingNext={pending?.user.id === user.id ? pending.next : null}
                  busy={busy}
                  actionLabel="일반 사용자로 변경"
                  actionVariant="secondary"
                  onAsk={() => ask(user, "USER")}
                  onCancel={() => setPending(null)}
                  onConfirm={apply}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900">관리자 지정</h2>
          <p className="mt-1 text-sm text-zinc-500">정상 상태인 일반 사용자 중에서 찾습니다.</p>
        </div>
        <TextInput
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          placeholder="닉네임 또는 이메일"
        />
        {keyword && (
          <QueryState
            loading={candidates.loading}
            error={candidates.error}
            empty={candidates.data?.items.length === 0}
            emptyText="해당하는 사용자가 없습니다."
            onRetry={candidates.reload}
          />
        )}
        {keyword && candidates.data && candidates.data.items.length > 0 && (
          <ul className="flex flex-col gap-2">
            {candidates.data.items.map((user) => (
              <li key={user.id} className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
                <OperatorRow
                  user={user}
                  me={user.id === myId}
                  pendingNext={pending?.user.id === user.id ? pending.next : null}
                  busy={busy}
                  actionLabel="관리자로 지정"
                  actionVariant="primary"
                  onAsk={() => ask(user, "ADMIN")}
                  onCancel={() => setPending(null)}
                  onConfirm={apply}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OperatorRow({
  user,
  me,
  pendingNext,
  busy,
  actionLabel,
  actionVariant,
  onAsk,
  onCancel,
  onConfirm,
}: {
  user: AdminUser;
  me: boolean;
  pendingNext: UserRole | null;
  busy: boolean;
  actionLabel: string;
  actionVariant: "primary" | "secondary";
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const warning =
    pendingNext === "ADMIN"
      ? `${user.nickname} 님에게 관리자 권한을 줍니다. 신고 처리, 사용자 정지, 장소 가리기를 모두 할 수 있게 됩니다.`
      : me
        ? "본인의 관리자 권한을 내립니다. 다시 로그인하면 이 콘솔에 들어올 수 없습니다."
        : `${user.nickname} 님의 관리자 권한을 내립니다.`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <span className="truncate">{user.nickname}</span>
            {me && <Badge tone="strong">나</Badge>}
          </p>
          <p className="truncate text-[13px] text-zinc-400">{user.email}</p>
        </div>
        {!pendingNext && (
          <Button variant={actionVariant} size="sm" disabled={busy} onClick={onAsk}>
            {actionLabel}
          </Button>
        )}
      </div>

      {pendingNext && (
        <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
          <p className="text-[13px] leading-relaxed text-amber-800">
            {warning} 모든 기기에서 로그아웃됩니다.
          </p>
          <div className="flex gap-2">
            <Button variant="caution" size="sm" disabled={busy} onClick={onConfirm}>
              {busy ? "변경 중..." : "변경"}
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={onCancel}>
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
