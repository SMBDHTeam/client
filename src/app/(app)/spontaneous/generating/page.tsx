"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";

/**
 * useSearchParams 를 쓰는 부분만 Suspense 안에 둔다.
 *
 * <p>이 훅은 렌더를 클라이언트로 미루므로, 페이지 최상위에서 부르면 정적 생성이
 * 통째로 막히고 빌드가 실패한다. 경계를 두면 그 안쪽만 클라이언트에서 그린다.
 *
 * <p>fallback 은 로딩 화면 그대로다. 다른 것을 넣으면 찰나에 화면이 바뀐다.
 */
export default function SpontaneousGeneratingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GeneratingView />
    </Suspense>
  );
}

function GeneratingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft } = useSpontaneousDraft();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!draft.selectedDestinationId) {
      router.replace("/spontaneous");
    }
  }, [draft.selectedDestinationId, router]);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="w-full rounded-2xl bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">코스를 만들지 못했어요</p>
          <p className="mt-1 text-xs text-red-500">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => router.replace("/spontaneous/destinations")}
          className="mt-4 text-sm font-bold text-[#2E7DF2]"
        >
          다른 목적지 선택
        </button>
        <button
          type="button"
          onClick={() => router.replace("/spontaneous")}
          className="mt-2 text-sm text-zinc-400"
        >
          처음부터 다시
        </button>
      </div>
    );
  }

  return <Loading />;
}

function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="size-16 animate-spin rounded-full border-[6px] border-zinc-200 border-t-[#2E7DF2]" />
      <h1 className="mt-7 text-xl font-bold">코스를 만들고 있어요</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        실제 이동시간과 장소 데이터를 반영해<br />최적의 코스를 생성하고 있어요
      </p>
    </div>
  );
}
