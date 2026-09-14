"use client";

import { useState } from "react";
import Link from "next/link";
import { getStatsPopular, getStatsSummary, getStatsTrend } from "@/lib/api/admin";
import { useAdminQuery } from "@/lib/api/use-admin-query";
import { QueryState } from "@/components/admin/QueryState";
import { FilterTabs, PageHeader } from "@/components/admin/ui";
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
      <PageHeader
        title="대시보드"
        description="지금 서비스에서 무슨 일이 일어나고 있는지"
        action={
          <FilterTabs
            options={RANGES.map((value) => ({ value: String(value), label: `${value}일` }))}
            value={String(days)}
            onChange={(value) => setDays(Number(value))}
          />
        }
      />

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

      <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-zinc-900">추이</h2>
          <FilterTabs
            options={METRICS.map((m) => ({ value: m.key, label: m.label }))}
            value={metric}
            onChange={setMetric}
          />
        </div>
        <QueryState loading={trend.loading} error={trend.error} onRetry={trend.reload} />
        {trend.data && <TrendChart points={trend.data.points} />}
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
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-[13px] text-zinc-400">
        최근 {days}일{" "}
        <span className="font-semibold text-[#17B89B] tabular-nums">
          +{delta.toLocaleString()}
        </span>
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
      className={`rounded-2xl p-5 ring-1 transition-colors ${
        urgent
          ? "bg-rose-50 ring-rose-200 hover:bg-rose-100"
          : "bg-white ring-black/5 hover:bg-zinc-50"
      }`}
    >
      <p className={`text-sm font-medium ${urgent ? "text-rose-700" : "text-zinc-500"}`}>
        {label}
      </p>
      <p
        className={`mt-1.5 text-3xl font-bold tracking-tight tabular-nums ${
          urgent ? "text-rose-600" : "text-zinc-900"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </Link>
  );
}

/**
 * 추이 그래프.
 *
 * <p>차트 라이브러리를 넣지 않았다. 값이 하루 한 점, 최대 90개라 SVG 로 충분하고
 * 의존성 하나를 아낀다.
 *
 * <p>좌표를 뷰박스 안에서 직접 계산한다. 백분율 높이는 부모 높이가 확정돼야 풀리는데,
 * flex 정렬에 따라 auto 가 되면 그래프가 통째로 사라진다. 한 번 겪었다.
 */
function TrendChart({ points }: { points: { date: string; count: number }[] }) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">기간에 값이 없습니다.</p>;
  }

  const WIDTH = 720;
  const HEIGHT = 160;
  const PAD = 10;

  const max = Math.max(...points.map((point) => point.count), 1);
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const peak = points.reduce((best, point) => (point.count > best.count ? point : best), points[0]);

  const stepX = points.length > 1 ? (WIDTH - PAD * 2) / (points.length - 1) : 0;
  const xAt = (index: number) => PAD + index * stepX;
  const yAt = (count: number) => HEIGHT - PAD - (count / max) * (HEIGHT - PAD * 2);

  const line = points.map((point, index) => `${xAt(index)},${yAt(point.count)}`).join(" ");
  const area = `${xAt(0)},${HEIGHT - PAD} ${line} ${xAt(points.length - 1)},${HEIGHT - PAD}`;

  // 점이 빽빽하면 서로 겹쳐 선이 뭉개진다. 개수에 따라 줄인다.
  const radius = points.length > 45 ? 1.6 : points.length > 20 ? 2.4 : 3.2;

  // 긴 구간은 일별 변동이 커서 톱니만 보이고 추세가 묻힌다. 이동평균을 겹쳐 둔다.
  // 원본을 지우지는 않는다. 평균만 남기면 뾰족한 날이 사라져 사고를 놓친다.
  const SMOOTH_WINDOW = 7;
  const smoothed = points.length > 30;
  const average = points.map((_, index) => {
    const from = Math.max(0, index - SMOOTH_WINDOW + 1);
    const slice = points.slice(from, index + 1);
    return slice.reduce((sum, point) => sum + point.count, 0) / slice.length;
  });
  const averageLine = average.map((value, index) => `${xAt(index)},${yAt(value)}`).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs text-zinc-400">
        <span>
          최대 <span className="font-medium text-zinc-600">{max}</span>건
          <span className="ml-1 text-zinc-300">({peak.date.slice(5)})</span>
        </span>
        <span>
          {smoothed && <span className="mr-2 text-zinc-300">7일 이동평균</span>}
          합계 <span className="font-medium text-zinc-600">{total.toLocaleString()}</span>건
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`기간 추이. 최대 ${max}건, 합계 ${total}건`}
      >
        {/* 최댓값 기준선. 막대 길이가 무엇에 대한 비율인지 보이게 한다. */}
        <line
          x1={PAD}
          x2={WIDTH - PAD}
          y1={yAt(max)}
          y2={yAt(max)}
          stroke="#E4E4E7"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <line
          x1={PAD}
          x2={WIDTH - PAD}
          y1={HEIGHT - PAD}
          y2={HEIGHT - PAD}
          stroke="#E4E4E7"
          strokeWidth="1"
        />

        <polygon points={area} fill="#2E7DF2" fillOpacity="0.08" />
        <polyline
          points={line}
          fill="none"
          stroke="#2E7DF2"
          strokeWidth={smoothed ? 1 : 1.5}
          strokeOpacity={smoothed ? 0.3 : 1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {smoothed && (
          <polyline
            points={averageLine}
            fill="none"
            stroke="#2E7DF2"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {points.map((point, index) => {
          const last = index === points.length - 1;
          if (smoothed && !last) {
            return null;
          }
          return (
            <circle
              key={point.date}
              cx={xAt(index)}
              cy={yAt(point.count)}
              r={last ? radius + 1.4 : radius}
              fill={point.count === 0 ? "#D4D4D8" : "#2E7DF2"}
              stroke={last ? "#FFFFFF" : "none"}
              strokeWidth={last ? 2 : 0}
            >
              <title>{`${point.date} · ${point.count}건`}</title>
            </circle>
          );
        })}
      </svg>

      <div className="flex justify-between text-xs text-zinc-400">
        <span>{points[0].date}</span>
        <span>{points[points.length - 1].date}</span>
      </div>
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
    <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
      <h2 className="text-base font-bold text-zinc-900">{title}</h2>
      {note && <p className="mt-1 text-[13px] text-zinc-400">{note}</p>}
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
                className="flex items-center gap-3 border-b border-zinc-100 py-2.5 last:border-0"
              >
                <span className="w-5 text-[13px] font-semibold text-zinc-300 tabular-nums">
                  {index + 1}
                </span>
                <span className="flex-1 truncate text-sm text-zinc-700">{item.name}</span>
                <span className="text-sm font-bold text-zinc-900 tabular-nums">{item.count}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

