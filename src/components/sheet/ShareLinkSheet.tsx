"use client";

import { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { toast } from "sonner";

export default function ShareLinkSheet({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("링크가 복사됐어요.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크를 복사하지 못했어요.");
    }
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center px-5">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white p-5 transition-all duration-200 ease-out ${
          shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">일정 공유하기</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-1 text-sm text-zinc-400">
          이 링크를 가진 사람은 누구나 로그인 없이 일정을 볼 수 있어요.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5">
          <p className="min-w-0 flex-1 truncate text-sm text-zinc-700">{url}</p>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="링크 복사"
            className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-600 hover:bg-black/5"
          >
            {copied ? <Check size={16} className="text-[#17B89B]" /> : <Copy size={16} />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3 text-center text-sm font-semibold text-white transition-transform active:scale-95"
        >
          링크 복사하기
        </button>
      </div>
    </div>
  );
}
