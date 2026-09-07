"use client";

import { useState } from "react";
import Link from "next/link";
import { getStatsPopular, getStatsSummary, getStatsTrend } from "@/lib/api/admin";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import type { StatsMetric } from "@/types/api/admin";

const RANGES = [7, 30, 90];
const METRICS: { key: StatsMetric; label: string }[] = [
  { key: "USERS", label: "가입" },
  { key: "POSTS", label: "게시물" },
  { key: "SCHEDULES", label: "일정" },
];

export default function AdminDashboardPage() {
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<StatsMetric>("POSTS");

  const summary = useAdminQuery(() => getStatsSummary(days), `summary:${days}`);
  const trend = useAdminQuery(() => getStatsTrend(metric, days), `trend:${metric}:${days}`);
  const places = useAdminQuery(() => getStatsPopular("PLACE", 10), "popular:place");
  const hashtags = useAdminQuery(() => getStatsPopular("HASHTAG", 10), "popular:hashtag");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-zinc-900">대시보드</h1>
        <Segmented
          options={RANGES.map((value) => ({ value, label: `${value}일` }))}
          value={days}
          onChange={setDays}
        />
      </div>

      <QueryState
        loading={summary.loading}
        error={summary.error}
        onRetry={summary.reload}
      />

      {summary.data && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="가입자" value={summary.data.users.total} delta={summary.data.users.recent} days={days} />
            <Stat label="게시물" value={summary.data.posts.total} delta={summary.data.posts.recent} days={days} />
            <Stat label="일정" value={summary.data.schedules.total} delta={summary.data.schedules.recent} days={days} />
          </section>

          {/* 조치가 필요한 값은 따로 묶어 눈에 띄게 둔다. */}
          <section className="grid grid-cols-3 gap-3">
            <Action
              label="대기 중 신고"
              value={summary.data.pendingReports}
              href="/admin/reports"
              urgent={summary.data.pendingReports > 0}
            />
            <Action
              label="정지된 사용자"
              value={summary.data.suspendedUsers}
              href="/admin/users"
            />
            <Action
              label="노출 중 장소"
              value={summary.data.visiblePlaces}
              href="/admin/places"
            />
          </section>
        </>
      )}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-zinc-900">추이</h2>
          <Segmented
            options={METRICS.map((m) => ({ value: m.key, label: m.label }))}
            value={metric}
            onChange={setMetric}
          />
        </div>
        <QueryState loading={trend.loading} error={trend.error} onRetry={trend.reload} />
        {trend.data && <TrendBars points={trend.data.points} />}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <RankCard
          title="많이 태그된 장소"
          state={places}
          note="게시물에 태그된 횟수다. 일정에 담긴 횟수가 아니다."
        />
        <RankCard title="많이 쓰인 해시태그" state={hashtags} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  days,
}: {
  label: string;
  value: number;
  delta: number;
  days: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-zinc-400">
        최근 {days}일 <span className="text-[#17B89B]">+{delta.toLocaleString()}</span>
      </p>
    </div>
  );
}

function Action({
  label,
  value,
  href,
  urgent,
}: {
  label: string;
  value: number;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl p-4 ring-1 transition ${
        urgent
          ? "bg-rose-50 ring-rose-200 hover:bg-rose-100"
          : "bg-white ring-black/5 hover:bg-zinc-50"
      }`}
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${urgent ? "text-rose-600" : "text-zinc-900"}`}
      >
        {value.toLocaleString()}
      </p>
    </Link>
  );
}

/**
 * 막대 그래프.
 *
 * 차트 라이브러리를 넣지 않았다. 값이 하루 한 점, 최대 90개라 이 정도면 충분하고
 * 의존성 하나를 아낀다.
 */
function TrendBars({ points }: { points: { date: string; count: number }[] }) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">기간에 값이 없습니다.</p>;
  }
  const max = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="flex h-40 items-end gap-px overflow-x-auto">
      {points.map((point) => (
        <div
          key={point.date}
          className="group relative flex min-w-1.5 flex-1 flex-col justify-end"
          title={`${point.date} · ${point.count}`}
        >
          <div
            className="rounded-t bg-[#2E7DF2]"
            // 0 이어도 1px 은 남긴다. 빈 날과 없는 날이 같아 보이면 안 된다.
            style={{ height: `${Math.max((point.count / max) * 100, 1)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function RankCard({
  title,
  state,
  note,
}: {
  title: string;
  state: ReturnType<typeof useAdminQuery<{ items: { id: number | null; name: string; count: number }[] }>>;
  note?: string;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <h2 className="text-sm font-bold text-zinc-900">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-zinc-400">{note}</p>}
      <div className="mt-3">
        <QueryState
          loading={state.loading}
          error={state.error}
          empty={state.data?.items.length === 0}
          emptyText="아직 집계된 값이 없습니다."
          onRetry={state.reload}
        />
        {state.data && state.data.items.length > 0 && (
          <ol className="flex flex-col">
            {state.data.items.map((item, index) => (
              <li
                key={`${item.id ?? item.name}`}
                className="flex items-center gap-3 border-b border-zinc-100 py-2 last:border-0"
              >
                <span className="w-4 text-xs font-medium text-zinc-400">{index + 1}</span>
                <span className="flex-1 truncate text-sm text-zinc-700">{item.name}</span>
                <span className="text-sm font-medium text-zinc-900">{item.count}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            option.value === value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
