"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, EyeOff, Eye } from "lucide-react";
import {
  getIngestionStatus,
  getPlaces,
  runIngestion,
  updatePlaceHidden,
} from "@/lib/api/admin";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import { Pager } from "@/components/admin/Pager";
import type { AdminPlace } from "@/types/api/admin";

const PAGE_SIZE = 20;

const FILTERS: { value: "" | "visible" | "hidden"; label: string }[] = [
  { value: "", label: "전체" },
  { value: "visible", label: "노출 중" },
  { value: "hidden", label: "가림" },
];

export default function AdminPlacesPage() {
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<"" | "visible" | "hidden">("");
  const [page, setPage] = useState(0);

  // 타이핑마다 부르지 않는다. 475건을 훑는 질의라 매 글자 조회가 비싸다.
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const hidden = filter === "" ? undefined : filter === "hidden";

  const list = useAdminQuery(
    () => getPlaces({ keyword: keyword || undefined, hidden, page, size: PAGE_SIZE }),
    `places:${keyword}:${filter}:${page}`,
  );

  const lastPage = list.data ? Math.max(Math.ceil(list.data.totalCount / PAGE_SIZE) - 1, 0) : 0;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-lg font-bold text-zinc-900">장소</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          placeholder="이름 또는 주소"
          className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/5 outline-none focus:ring-[#2E7DF2]"
        />
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
          {FILTERS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                setFilter(option.value);
                setPage(0);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                option.value === filter ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <QueryState
        loading={list.loading}
        error={list.error}
        empty={list.data?.items.length === 0}
        emptyText="해당하는 장소가 없습니다."
        onRetry={list.reload}
      />

      {list.data && list.data.items.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {list.data.items.map((place) => (
              <PlaceRow key={place.id} place={place} onChanged={list.reload} />
            ))}
          </ul>

          <Pager page={page} lastPage={lastPage} total={list.data.totalCount} onChange={setPage} />
        </>
      )}

      <IngestionPanel />
    </div>
  );
}

function PlaceRow({ place, onChanged }: { place: AdminPlace; onChanged: () => void }) {
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function apply(hidden: boolean, why?: string) {
    setBusy(true);
    setFailure(null);
    try {
      await updatePlaceHidden(place.id, { hidden, reason: why });
      setAsking(false);
      setReason("");
      onChanged();
    } catch {
      setFailure("처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className={`rounded-2xl p-4 ring-1 ${
        place.hidden ? "bg-zinc-100 ring-zinc-200" : "bg-white ring-black/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-zinc-900">
            {place.name}
            {place.hidden && (
              <span className="shrink-0 rounded-md bg-zinc-300 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700">
                가림
              </span>
            )}
          </p>
          <p className="truncate text-xs text-zinc-400">{place.address || "주소 없음"}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            #{place.id} · {place.source}
          </p>
          {place.hidden && place.hiddenReason && (
            <p className="mt-1 truncate text-xs text-zinc-500">사유: {place.hiddenReason}</p>
          )}
        </div>

        {place.hidden ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => apply(false)}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-black/5 disabled:opacity-40"
          >
            <Eye size={13} aria-hidden />
            해제
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setAsking((value) => !value)}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 disabled:opacity-40"
          >
            <EyeOff size={13} aria-hidden />
            가리기
          </button>
        )}
      </div>

      {asking && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-zinc-50 p-3">
          {/* 사유를 남겨 두지 않으면 나중에 왜 가렸는지 아무도 모른다. */}
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="가리는 사유 (예: 좌표가 실제 위치와 다름)"
            maxLength={500}
            className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/5 outline-none"
          />
          <p className="text-xs text-zinc-500">
            검색·상세에서 빠지고 일정 후보에서도 제외됩니다. 지우는 것이 아니라 언제든 되돌릴
            수 있습니다.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={() => apply(true, reason.trim())}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              가리기
            </button>
            <button
              type="button"
              onClick={() => setAsking(false)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-600"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {failure && <p className="mt-2 text-xs text-rose-600">{failure}</p>}
    </li>
  );
}

/**
 * 적재는 장소 데이터 관리와 성격이 다르다. 여기 있는 것은 마땅한 자리가 아직 없어서다.
 * 기본으로 접어 두고, 예산을 확인할 때만 편다. 운영 화면이 생기면 그쪽으로 옮긴다.
 */
function IngestionPanel() {
  const [open, setOpen] = useState(false);
  const status = useAdminQuery(() => getIngestionStatus(), "ingestion");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);

  const data = status.data;

  async function execute() {
    setBusy(true);
    setOutcome(null);
    try {
      const result = await runIngestion();
      setOutcome(
        result.lockSkipped
          ? "다른 적재가 진행 중이라 건너뛰었습니다."
          : `발견 ${result.discovered} · 보강 ${result.enriched} · 변화 없음 ${result.unchanged} · 실패 ${result.failed} (호출 ${result.apiRequests}회)`,
      );
      setConfirming(false);
      status.reload();
    } catch {
      setOutcome("적재를 실행하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4"
      >
        <span className="text-sm font-bold text-zinc-900">TourAPI 적재</span>
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          {data && `오늘 ${data.requestsUsed}/${data.dailyLimit}`}
          {open ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-zinc-100 px-5 py-4">
          <QueryState loading={status.loading} error={status.error} onRetry={status.reload} />

          {data && (
            <>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-zinc-500">오늘 사용 ({data.quotaDate})</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {data.requestsUsed} / {data.dailyLimit}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${
                      data.requestsRemaining === 0 ? "bg-rose-500" : "bg-[#2E7DF2]"
                    }`}
                    style={{
                      width: `${Math.min((data.requestsUsed / data.dailyLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  남은 호출 {data.requestsRemaining}회
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Toggle label="적재 스케줄러" on={data.ingestionEnabled} />
                <Toggle label="상세 보강" on={data.enrichmentEnabled} />
                {Object.entries(data.statusCounts).map(([key, count]) => (
                  <span
                    key={key}
                    className="rounded-lg bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600"
                  >
                    {key} <span className="font-medium text-zinc-900">{count}</span>
                  </span>
                ))}
              </div>
              <p className="text-xs text-zinc-400">
                토글은 서버 환경변수라 화면에서 바꿀 수 없습니다.
              </p>

              {outcome && <p className="text-sm text-zinc-700">{outcome}</p>}

              {confirming ? (
                <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-3">
                  <p className="text-xs text-amber-800">
                    오늘 남은 {data.requestsRemaining}회 중 일부를 씁니다. 예산을 다 쓰면
                    자정(KST)까지 스케줄러도 돌지 못합니다.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={execute}
                      className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                    >
                      {busy ? "실행 중…" : "적재 실행"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-600"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={data.requestsRemaining === 0}
                  onClick={() => setConfirming(true)}
                  className="self-start rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {data.requestsRemaining === 0 ? "오늘 예산 소진" : "수동 적재"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <span className="flex items-center gap-1.5 rounded-lg bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600">
      <span className={`size-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-zinc-300"}`} />
      {label} {on ? "켜짐" : "꺼짐"}
    </span>
  );
}
