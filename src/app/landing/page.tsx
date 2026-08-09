"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import gwanganImg from "@/assets/images/gwangan.jpg";

export default function LandingTempPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const w = 500,
      h = 600;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
    const popup = window.open(
      "",
      "GoogleLogin",
      `width=${w},height=${h},left=${left},top=${top}`,
    );
    if (!popup) return;

    const form = popup.document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/signin/google";
    const csrfRes = await fetch("/api/auth/csrf");
    const { csrfToken } = await csrfRes.json();
    const addField = (name: string, value: string) => {
      const input = popup.document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };
    addField("csrfToken", csrfToken);
    addField("callbackUrl", `${window.location.origin}/auth-success`);
    popup.document.body.appendChild(form);
    form.submit();

    const onMessage = async (e: MessageEvent) => {
      if (e.data === "auth-success") {
        window.removeEventListener("message", onMessage);
        const { getSession } = await import("next-auth/react");
        await getSession();
        router.push("/home");
      }
    };
    window.addEventListener("message", onMessage);
  };

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-lg flex-col bg-white text-zinc-900 shadow-[0_0_60px_-15px_rgba(15,23,42,0.25)]">
      <main className="flex-1 overflow-y-auto px-6 py-12">
        <div>
          <p className="text-sm font-semibold text-[#2E7DF2]">
            부산 여행 일정 플래너
          </p>

          <h1 className="mt-4 text-[32px] font-bold leading-tight text-zinc-900">
            일상의 탈출,
            <br />
            떠나는 즐거움
            <br />
            부산 여행과 함께
          </h1>

          <div className="mt-6 space-y-1 text-sm text-zinc-500">
            <p>부산 도심부터 바다까지, 나만의 여행 코스</p>
            <p>지금 바로 무료로 일정을 만들어보세요</p>
          </div>
        </div>

        <div className="relative mt-10 aspect-4/3 w-full overflow-hidden rounded-3xl">
          <Image
            src={gwanganImg}
            alt="부산 광안대교"
            fill
            sizes="(max-width: 512px) 100vw, 512px"
            className="object-cover"
          />
          <span className="absolute top-4 left-4 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold tracking-tight text-zinc-900 backdrop-blur-sm">
            BUSAN TRIP &apos;26
          </span>
        </div>
      </main>

      <div className="shrink-0 bg-white px-6 py-4">
        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-[0_2px_10px_rgba(15,23,42,0.12)] ring-1 ring-black/10 transition-transform active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          Google로 시작하기
        </button>
      </div>
    </div>
  );
}
