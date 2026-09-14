import type { ScheduleTransit, ScheduleTransitSegment } from "@/types/api/schedule";
import type { ScheduleRouteLine } from "@/types/api/schedule-map";

const TRANSIT_MODE: Record<string, { label: string; className: string }> = {
  WALK: { label: "도보", className: "bg-zinc-100 text-zinc-600" },
  BUS: { label: "버스", className: "bg-blue-100 text-blue-700" },
  SUBWAY: { label: "지하철", className: "bg-emerald-100 text-emerald-700" },
  TRAIN: { label: "열차", className: "bg-violet-100 text-violet-700" },
  CAR: { label: "자동차", className: "bg-rose-100 text-rose-700" },
};

function present(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function modeInfo(mode: string) {
  return TRANSIT_MODE[mode] ?? {
    label: mode,
    className: "bg-zinc-100 text-zinc-600",
  };
}

function transitLabel(transit: ScheduleTransit) {
  const suppliedSummary = present(transit.summary);
  if (suppliedSummary) return suppliedSummary;

  const rides = transit.segments
    .filter((segment) => segment.mode !== "WALK")
    .map((segment) => {
      const lineName = present(segment.lineName);
      return `${modeInfo(segment.mode).label}${lineName ? ` ${lineName}` : ""}`;
    });
  const route = rides.length > 0 ? rides.join(" → ") : "도보";
  return `${route} · ${transit.totalMinutes}분`;
}

function SegmentDetail({ segment }: { segment: ScheduleTransitSegment }) {
  const mode = modeInfo(segment.mode);
  const lineName = present(segment.lineName);
  const startStation = present(segment.startStationName);
  const endStation = present(segment.endStationName);
  const instruction = present(segment.instruction);
  const stations =
    startStation && endStation
      ? `${startStation} → ${endStation}`
      : startStation ?? endStation;

  return (
    <li className="flex items-start gap-2 leading-relaxed">
      <span className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${mode.className}`}>
        {mode.label}
      </span>
      <span className="min-w-0">
        <span className="text-zinc-700">
          {lineName ? `${lineName} · ` : ""}{segment.durationMinutes}분
        </span>
        {stations && <span className="mt-0.5 block text-zinc-500">{stations}</span>}
        <span className="mt-0.5 flex flex-wrap gap-x-2 text-zinc-400">
          {segment.stationCount != null && <span>{segment.stationCount}개 정류장</span>}
          {segment.waitMinutes > 0 && <span>대기 {segment.waitMinutes}분</span>}
        </span>
        {instruction && <span className="mt-0.5 block text-zinc-400">{instruction}</span>}
      </span>
    </li>
  );
}

function roadDurationLabel(durationMinutes: number | null | undefined) {
  if (durationMinutes == null || durationMinutes < 0) return null;
  return durationMinutes === 0 ? "1분 미만" : `${durationMinutes}분`;
}

function roadDistanceLabel(distanceMeters: number | null | undefined) {
  if (distanceMeters == null || distanceMeters < 1) return null;
  if (distanceMeters < 1000) return `${distanceMeters}m`;
  return `${(distanceMeters / 1000).toFixed(1).replace(/\.0$/, "")}km`;
}

function RoadGuidanceDetail({
  routeLine,
  index,
}: {
  routeLine: ScheduleRouteLine;
  index: number;
}) {
  const instruction = present(routeLine.instruction);
  const lineName = present(routeLine.lineName);
  const duration = roadDurationLabel(routeLine.durationMinutes);
  const distance = roadDistanceLabel(routeLine.distanceMeters);
  const primary = instruction ?? lineName;
  const metadata = [instruction ? lineName : null, duration, distance].filter(Boolean);

  return (
    <li className="flex items-start gap-2 leading-relaxed">
      <span className="shrink-0 text-zinc-400">{index + 1}.</span>
      <span className="min-w-0">
        {primary && <span className="block text-zinc-700">{primary}</span>}
        {metadata.length > 0 && (
          <span className={`${primary ? "mt-0.5 " : ""}block text-zinc-500`}>
            {metadata.join(" · ")}
          </span>
        )}
      </span>
    </li>
  );
}

export default function TransitPanel({
  transit,
  hasRouteGeometry,
  routeLines = [],
  showSpontaneousRoadGuidance = false,
}: {
  transit: ScheduleTransit;
  hasRouteGeometry: boolean;
  routeLines?: ScheduleRouteLine[];
  showSpontaneousRoadGuidance?: boolean;
}) {
  const provider = present(transit.provider);
  const providerKey = provider?.toUpperCase();
  const estimated =
    !provider ||
    providerKey === "FAKE" ||
    providerKey === "UNKNOWN" ||
    transit.fallbackUsed ||
    transit.realtimeStatus === "UNAVAILABLE";
  const partiallyEstimated = !estimated && transit.realtimeStatus === "PARTIAL";
  const originName = present(transit.originName);
  const destinationName = present(transit.destinationName);
  const warnings = transit.warnings.filter((warning) => present(warning));
  const hasPublicRide = transit.segments.some((segment) => segment.mode !== "WALK");
  const statusLabel = !hasRouteGeometry
    ? "경로 상세 없음"
    : estimated
      ? "예상 경로"
      : partiallyEstimated
        ? "일부 예상 경로"
        : "경로 확인";
  const verified = hasRouteGeometry && !estimated && !partiallyEstimated;
  const roadSegment =
    transit.segments.length === 1 && ["CAR", "WALK"].includes(transit.segments[0].mode)
      ? transit.segments[0]
      : null;
  const usesSpontaneousRoadGuidance =
    showSpontaneousRoadGuidance && providerKey === "TMAP" && roadSegment != null;
  const roadGuidanceLines = usesSpontaneousRoadGuidance
    ? routeLines.filter(
        (routeLine) =>
          present(routeLine.instruction) != null ||
          present(routeLine.lineName) != null ||
          roadDurationLabel(routeLine.durationMinutes) != null ||
          roadDistanceLabel(routeLine.distanceMeters) != null,
      )
    : [];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm leading-snug font-semibold text-zinc-800">
            {transitLabel(transit)}
          </p>
          {(originName || destinationName) && (
            <p className="mt-1 truncate text-xs text-zinc-500">
              {[originName, destinationName].filter(Boolean).join(" → ")}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
            verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
        {transit.walkMinutes > 0 && <span>도보 {transit.walkMinutes}분</span>}
        {hasPublicRide && <span>환승 {transit.transferCount}회</span>}
        {transit.fareAmount != null && <span>약 {transit.fareAmount.toLocaleString()}원</span>}
        {provider && <span>{provider}</span>}
      </div>

      {usesSpontaneousRoadGuidance ? (
        <ol className="mt-3 flex flex-wrap items-center gap-1.5">
          <li>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${modeInfo(roadSegment.mode).className}`}
            >
              {modeInfo(roadSegment.mode).label}
              {roadDurationLabel(roadSegment.durationMinutes)
                ? ` · ${roadDurationLabel(roadSegment.durationMinutes)}`
                : ""}
            </span>
          </li>
        </ol>
      ) : transit.segments.length > 0 && (
        <ol className="mt-3 flex flex-wrap items-center gap-1.5">
          {transit.segments.map((segment, index) => {
            const mode = modeInfo(segment.mode);
            const lineName = present(segment.lineName);
            return (
              <li key={`${segment.order}-${segment.mode}`} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-xs text-zinc-300">→</span>}
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${mode.className}`}>
                  {mode.label}{lineName ? ` ${lineName}` : ""} · {segment.durationMinutes}분
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {usesSpontaneousRoadGuidance ? roadGuidanceLines.length > 0 && (
        <details className="mt-3 border-t border-zinc-100 pt-2 text-xs text-zinc-600">
          <summary className="cursor-pointer font-semibold text-zinc-700">구간 자세히</summary>
          <ol className="mt-2 space-y-2">
            {roadGuidanceLines.map((routeLine, index) => (
              <RoadGuidanceDetail
                key={`${routeLine.routeOrder}-${routeLine.lineOrder}`}
                routeLine={routeLine}
                index={index}
              />
            ))}
          </ol>
        </details>
      ) : transit.segments.length > 0 && (
        <details className="mt-3 border-t border-zinc-100 pt-2 text-xs text-zinc-600">
          <summary className="cursor-pointer font-semibold text-zinc-700">구간 자세히</summary>
          <ol className="mt-2 space-y-2">
            {transit.segments.map((segment) => (
              <SegmentDetail key={`${segment.order}-${segment.mode}`} segment={segment} />
            ))}
          </ol>
        </details>
      )}

      {warnings.map((warning) => (
        <p key={warning} className="mt-2 text-xs text-amber-700">{warning}</p>
      ))}
    </div>
  );
}
