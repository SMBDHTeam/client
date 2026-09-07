"use client";

/** 조회 중·실패·빈 결과를 같은 모양으로 보여 준다. */
export function QueryState({
  loading,
  error,
  empty,
  emptyText = "결과가 없습니다.",
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}) {
  if (loading) {
    return <Box>불러오는 중…</Box>;
  }
  if (error) {
    return (
      <Box>
        <span className="text-zinc-700">{error}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            다시 시도
          </button>
        )}
      </Box>
    );
  }
  if (empty) {
    return <Box>{emptyText}</Box>;
  }
  return null;
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-12 text-sm text-zinc-500 ring-1 ring-black/5">
      {children}
    </div>
  );
}
