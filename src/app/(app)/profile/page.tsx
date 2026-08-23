"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ChevronRight, LogOut, MapPin } from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="내정보" />

      <div className="flex flex-1 flex-col gap-6 px-5 pt-2 pb-8">
        <div className="flex items-center gap-4 rounded-3xl bg-linear-to-br from-[#2E7DF2] to-[#17B89B] p-5 text-white">
          <div className="size-16 shrink-0 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/60">
            {user?.image && (
              <img
                src={user.image}
                alt=""
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{user?.name ?? "게스트"}</p>
            <p className="truncate text-sm text-white/80">{user?.email ?? ""}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <Link
            href="/trips"
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-500">
              <MapPin size={16} aria-hidden />
            </span>
            <span className="flex-1 text-sm font-medium text-zinc-700">내 여행</span>
            <ChevronRight size={16} className="text-zinc-300" aria-hidden />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-auto flex items-center justify-center gap-2 rounded-full border border-zinc-200 py-3.5 text-sm font-semibold text-zinc-500"
        >
          <LogOut size={16} aria-hidden />
          로그아웃
        </button>
      </div>
    </div>
  );
}
