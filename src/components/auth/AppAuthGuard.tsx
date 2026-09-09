"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";

function currentCallbackUrl() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export default function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || session?.error || !session?.accessToken) {
      void signIn("google", {
        callbackUrl: currentCallbackUrl(),
      });
    }
  }, [session?.accessToken, session?.error, status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F6F8FC]">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.error || !session?.accessToken) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F6F8FC]">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2E7DF2]" />
      </div>
    );
  }

  return <>{children}</>;
}
