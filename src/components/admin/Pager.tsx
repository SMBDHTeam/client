"use client";

/** 목록 페이지 이동. 서버가 totalCount 를 주므로 마지막 페이지를 계산할 수 있다. */
export function Pager({
  page,
  lastPage,
  total,
  onChange,
}: {
  page: number;
  lastPage: number;
  total: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-xs text-zinc-500">
        전체 {total.toLocaleString()}건 · {page + 1} / {lastPage + 1}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-black/5 disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-black/5 disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
