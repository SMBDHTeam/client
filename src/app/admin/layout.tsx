"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { BarChart3, Flag, MapPinOff, Users } from "lucide-react";

/**
 * 관리자 콘솔 레이아웃.
 *
 * <p>여기서 막는 것은 <b>화면일 뿐</b>이다. 실제 방어는 서버가 한다. 모든 `/admin/**`
 * 경로가 ADMIN 권한을 요구하므로, 이 화면을 뚫고 들어와도 데이터는 401·403 이 된다.
 * 그래도 권한 없는 사람에게 빈 화면과 오류만 보여 주는 것보다는 이유를 알려 주는 편이 낫다.
 *
 * <p>사용자 앱의 하단 탭 셸을 쓰지 않는다. 성격이 다르고, 관리자는 목록과 표를 다루므로
 * 넓은 화면을 쓸 수 있어야 한다.
 */

const NAV = [
  { href: "/admin", label: "대시보드", icon: BarChart3 },
  { href: "/admin/reports", label: "신고", icon: Flag },
  { href: "/admin/users", label: "사용자", icon: Users },
  { href: "/admin/places", label: "장소", icon: MapPinOff },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return <Centered>확인하는 중…</Centered>;
  }

  if (status === "unauthenticated") {
    return (
      <Centered>
        <p className="text-zinc-600">로그인이 필요합니다.</p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          로그인
        </button>
      </Centered>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <Centered>
        <p className="font-medium text-zinc-800">관리자만 볼 수 있는 화면입니다.</p>
        <p className="text-sm text-zinc-500">
          권한이 필요하면 담당자에게 문의하세요.
        </p>
        <Link href="/home" className="text-sm font-medium text-[#2E7DF2]">
          홈으로
        </Link>
      </Centered>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <span className="text-sm font-bold text-zinc-900">관리자 콘솔</span>
          <span className="truncate text-xs text-zinc-500">
            {session.user.nickname ?? session.user.email}
          </span>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            // 대시보드는 정확히 일치할 때만 활성이다. startsWith 로 보면 항상 켜진다.
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon size={15} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">{children}</main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 text-center">
      {children}
    </div>
  );
}
