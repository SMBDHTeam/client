"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, ServerCrash } from "lucide-react";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import { getSpontaneousCourseErrorPresentation } from "@/lib/spontaneous-course-error";

export default function SpontaneousGeneratingPage() {
  const router = useRouter();
  const { draft, hydrated } = useSpontaneousDraft();
  const selectedDestinationId = draft.selectedDestinationId;
  const failure = selectedDestinationId
    ? draft.courseFailures?.[selectedDestinationId]
    : undefined;
  const presentation = failure
    ? getSpontaneousCourseErrorPresentation(
        failure,
        draft.conditions?.transportMode ?? "WALK",
      )
    : null;

  useEffect(() => {
    if (hydrated && !selectedDestinationId) {
      router.replace("/spontaneous");
    }
  }, [hydrated, router, selectedDestinationId]);

  if (!hydrated || !presentation) {
    return <Loading />;
  }

  const isConditionFailure = presentation.kind === "conditions";

  return (
    <div className="flex flex-1 flex-col justify-center px-6 py-8">
      <div
        className={`rounded-3xl border p-6 ${
          isConditionFailure
            ? "border-orange-100 bg-orange-50"
            : "border-red-100 bg-red-50"
        }`}
      >
        <div
          className={`grid size-12 place-items-center rounded-2xl ${
            isConditionFailure
              ? "bg-orange-100 text-orange-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isConditionFailure ? <CircleAlert size={24} /> : <ServerCrash size={24} />}
        </div>

        <p
          className={`mt-5 text-xs font-bold ${
            isConditionFailure ? "text-orange-600" : "text-red-600"
          }`}
        >
          {isConditionFailure
            ? "여행 조건을 만족하는 코스가 없어요"
            : "일시적인 서비스 오류예요"}
        </p>
        <h1 className="mt-1 text-xl font-bold leading-snug text-zinc-900">
          {presentation.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          {presentation.description}
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-zinc-800">
          {presentation.guidance}
        </p>

        <div className="mt-5 rounded-2xl bg-white/80 px-4 py-3">
          <p className="text-xs leading-relaxed text-zinc-500">
            {isConditionFailure
              ? "요청은 정상적으로 처리됐지만, 선택한 조건으로 실행 가능한 코스를 찾지 못했어요."
              : "선택한 여행 조건의 문제는 아니에요. 잠시 후 같은 목적지로 다시 시도할 수 있어요."}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => router.replace("/spontaneous/destinations")}
        className="mt-6 w-full rounded-full bg-linear-to-br from-[#2E7DF2] to-[#17B89B] py-3.5 text-center font-semibold text-white"
      >
        {isConditionFailure ? "다른 목적지 선택" : "목적지에서 다시 시도"}
      </button>
      <button
        type="button"
        onClick={() => router.replace("/spontaneous/conditions")}
        className="mt-3 w-full rounded-full border border-zinc-200 bg-white py-3.5 text-center font-semibold text-zinc-700"
      >
        여행 조건 변경
      </button>
      <button
        type="button"
        onClick={() => router.replace("/spontaneous")}
        className="mt-3 text-sm text-zinc-400"
      >
        처음부터 다시
      </button>
    </div>
  );
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
