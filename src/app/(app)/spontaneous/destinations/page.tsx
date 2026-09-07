"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSpontaneousDraft } from "@/store/spontaneous-draft";
import { createCourse } from "@/lib/api/spontaneous-trips";
import { ApiError } from "@/lib/api/axios";
import type { Destination } from "@/types/api/spontaneous-trip";

const TRANSPORT_LABEL: Record<string, string> = {
  PUBLIC_TRANSIT: "대중교통",
  WALK: "도보",
  CAR: "자동차",
};

function DestinationCard({
  destination,
  onSelect,
}: {
  destination: Destination;
  onSelect: () => void;
}) {
  const { transport } = destination;
  const hours = Math.floor(transport.availableStayMinutes / 60);
  const minutes = transport.availableStayMinutes % 60;
  const stayLabel = hours > 0 ? `${hours}시간 ${minutes > 0 ? `${minutes}분` : ""}` : `${minutes}분`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-3xl border border-zinc-100 bg-white p-5 text-left shadow-sm transition-all hover:border-[#2E7DF2]/40 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold text-zinc-800">{destination.name}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {(destination.distanceMeters / 1000).toFixed(1)}km 거리
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#2E7DF2]/10 px-2.5 py-1 text-xs font-semibold text-[#2E7DF2]">
          {TRANSPORT_LABEL[transport.mode]}
        </span>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex flex-1 flex-col items-center rounded-2xl bg-zinc-50 py-2.5">
          <p className="text-xs text-zinc-400">가는 시간</p>
          <p className="mt-0.5 text-sm font-bold text-zinc-700">{transport.outboundMinutes}분</p>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-2xl bg-zinc-50 py-2.5">
          <p className="text-xs text-zinc-400">오는 시간</p>
          <p className="mt-0.5 text-sm font-bold text-zinc-700">{transport.returnMinutes}분</p>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-2xl bg-[#17B89B]/10 py-2.5">
          <p className="text-xs text-[#17B89B]">여유 시간</p>
          <p className="mt-0.5 text-sm font-bold text-[#17B89B]">{stayLabel}</p>
        </div>
      </div>
    </button>
  );
}

export default function SpontaneousDestinationsPage() {
  const router = useRouter();
  const { draft, setSelectedDestinationId, setCourse } = useSpontaneousDraft();

  useEffect(() => {
    if (!draft.startLocation) {
      router.replace("/spontaneous");
      return;
    }
    if (!draft.conditions || !draft.destinations) {
      router.replace("/spontaneous/conditions");
    }
  }, [draft, router]);

  async function handleSelect(destination: Destination) {
    if (!draft.startLocation || !draft.conditions) return;

    setSelectedDestinationId(destination.destinationId);
    router.push("/spontaneous/generating");

    try {
      const course = await createCourse({
        destinationId: destination.destinationId,
        startLocation: {
          latitude: draft.startLocation.latitude,
          longitude: draft.startLocation.longitude,
        },
        ...draft.conditions,
      });
      setCourse(course);
      router.replace("/spontaneous/result");
    } catch (cause) {
      const message =
        cause instanceof ApiError ? cause.message : "코스를 만들지 못했습니다.";
      router.replace(`/spontaneous/generating?error=${encodeURIComponent(message)}`);
    }
  }

  const destinations = draft.destinations ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 px-5 pt-4 pb-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-2xl leading-none text-zinc-600 hover:bg-black/5"
        >
          ‹
        </button>
        <div>
          <h1 className="text-lg font-bold">목적지 추천</h1>
          <p className="text-xs text-zinc-400">가고 싶은 권역을 선택하세요</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-6">
        {destinations.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-400">추천 가능한 목적지가 없습니다</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-3 text-sm font-bold text-[#2E7DF2]"
            >
              조건 다시 설정
            </button>
          </div>
        ) : (
          destinations.map((dest) => (
            <DestinationCard
              key={dest.destinationId}
              destination={dest}
              onSelect={() => handleSelect(dest)}
            />
          ))
        )}
      </div>
    </div>
  );
}
