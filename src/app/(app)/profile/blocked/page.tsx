"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { getBlockedUsers, unblockUser, type UserSummary } from "@/lib/api/users";

export default function BlockedUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  useEffect(() => {
    getBlockedUsers({ size: 50 })
      .then((res) => setUsers(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUnblock(userId: number) {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("차단을 해제했어요.");
    } catch {
      toast.error("차단 해제에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">차단한 사용자</h1>
        <div className="size-8" />
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
        </div>
      ) : users.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-sm text-zinc-400">
          차단한 사용자가 없어요
        </p>
      ) : (
        <ul className="flex-1 divide-y divide-zinc-100 overflow-y-auto">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="size-10 shrink-0 overflow-hidden rounded-full bg-zinc-200">
                {u.profileImageUrl && (
                  <img
                    src={u.profileImageUrl}
                    alt={u.nickname}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                )}
              </div>
              <p className="flex-1 text-sm font-semibold">{u.nickname}</p>
              <button
                type="button"
                disabled={unblockingId === u.id}
                onClick={() => handleUnblock(u.id)}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 disabled:opacity-50"
              >
                차단 해제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
