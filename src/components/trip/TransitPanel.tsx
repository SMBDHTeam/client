import { ChevronRight, Footprints, Route } from "lucide-react";

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

function hasPublicTransitSegment(transit: ScheduleTransit) {
  return transit.segments.some((segment) => segment.mode !== "WALK");
}

function transitSummaryModeLabel(transit: ScheduleTransit) {
  const suppliedSummary = present(transit.summary);
  if (transit.segments.length === 0 && suppliedSummary) return suppliedSummary;
  if (hasPublicTransitSegment(transit)) return "대중교통";
  const mode = transit.segments[0]?.mode ?? "WALK";
  return modeInfo(mode).label;
}

function providerDisplayLabel(provider: string | null) {
  const key = provider?.toUpperCase();
  if (!key || key === "FAKE" || key === "UNKNOWN") return null;
  if (key === "ODSAY") return "대중교통 경로";
  if (key === "TMAP") return "도보 경로";
  if (key === "INTERNAL_WALK") return null;
  return null;
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
  emphasized = false,
}: {
  routeLine: ScheduleRouteLine;
  index: number;
  emphasized?: boolean;
}) {
  const instruction = present(routeLine.instruction);
  const lineName = present(routeLine.lineName);
  const duration = roadDurationLabel(routeLine.durationMinutes);
  const distance = roadDistanceLabel(routeLine.distanceMeters);
  const primary = instruction ?? lineName;
  const metadata = [instruction ? lineName : null, duration, distance].filter(Boolean);

  return (
    <li className={`flex items-start gap-3 leading-relaxed ${emphasized ? "relative pb-3 last:pb-0" : ""}`}>
      <span
        className={
          emphasized
            ? "relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-[#e8f2ff] text-[0.68rem] font-bold text-[#2f7ff2] ring-4 ring-white"
            : "shrink-0 text-zinc-400"
        }
      >
        {index + 1}{emphasized ? "" : "."}
      </span>
      {emphasized && (
        <span className="absolute top-5 bottom-0 left-[0.7rem] w-px bg-[#cfe2fb] last:hidden" />
      )}
      <span className="min-w-0">
        {primary && (
          <span className={`block ${emphasized ? "font-semibold text-[#183153]" : "text-zinc-700"}`}>
            {primary}
          </span>
        )}
        {metadata.length > 0 && (
          <span
            className={`${primary ? "mt-0.5 " : ""}block ${
              emphasized ? "text-[#7b8ba3]" : "text-zinc-500"
            }`}
          >
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
  appearance = "default",
}: {
  transit: ScheduleTransit;
  hasRouteGeometry: boolean;
  routeLines?: ScheduleRouteLine[];
  showSpontaneousRoadGuidance?: boolean;
  appearance?: "default" | "spontaneous-result";
}) {
  const provider = present(transit.provider);
  const providerKey = provider?.toUpperCase();
  const unresolvedRoute = providerKey === "UNRESOLVED";
  const estimated =
    !provider ||
    providerKey === "FAKE" ||
    providerKey === "UNKNOWN" ||
    unresolvedRoute ||
    transit.fallbackUsed ||
    transit.realtimeStatus === "UNAVAILABLE";
  const partiallyEstimated = !estimated && transit.realtimeStatus === "PARTIAL";
  const originName = present(transit.originName);
  const destinationName = present(transit.destinationName);
  const warnings = transit.warnings.filter((warning) => present(warning));
  const hasPublicRide = hasPublicTransitSegment(transit);
  const providerLabel = providerDisplayLabel(provider);
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
  const hasExpandableDetails = usesSpontaneousRoadGuidance
    ? roadGuidanceLines.length > 0
    : transit.segments.length > 0;
  const primaryMode = unresolvedRoute
    ? "TRANSIT"
    : hasPublicRide
      ? "TRANSIT"
      : roadSegment?.mode ?? transit.segments[0]?.mode ?? "WALK";
  const PrimaryModeIcon = primaryMode === "WALK" ? Footprints : Route;

  if (appearance === "spontaneous-result") {
    const routeTitle =
      originName || destinationName
        ? [originName, destinationName].filter(Boolean).join(" → ")
        : transitLabel(transit);

    return (
      <div className="rounded-[1.35rem] border border-[#e8edf4] bg-white px-4 py-3.5 shadow-[0_7px_20px_rgba(30,64,111,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-[-0.025em] text-[#122846]">
              {routeTitle}
            </p>
            <p className="mt-1 text-xs text-[#8190a6]">{transitLabel(transit)}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-bold ${
              verified ? "bg-[#dff8f1] text-[#0a9c80]" : "bg-[#fff1bf] text-[#b37100]"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <details className="group mt-3">
          <summary
            className={`flex list-none items-center gap-3 rounded-xl bg-[#f5f7fa] px-3 py-2.5 text-xs text-[#4d607d] [&::-webkit-details-marker]:hidden ${
              hasExpandableDetails ? "cursor-pointer hover:bg-[#eef3f8]" : "cursor-default"
            }`}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#2f7ff2] shadow-sm">
              <PrimaryModeIcon size={18} strokeWidth={2.15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-bold text-[#30435f]">
                {transitSummaryModeLabel(transit)} {transit.totalMinutes}분
              </span>
              {providerLabel && <span className="ml-2 text-[#7f8da3]">{providerLabel}</span>}
            </span>
            {hasExpandableDetails && (
              <span className="flex shrink-0 items-center gap-1 font-semibold text-[#42536d]">
                구간 자세히
                <ChevronRight
                  size={17}
                  className="transition-transform duration-200 group-open:rotate-90"
                />
              </span>
            )}
          </summary>

          {hasExpandableDetails && (
            <div className="mt-3 rounded-2xl border border-[#edf1f6] bg-[#fbfcfe] p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold text-[#324764]">상세 이동 안내</p>
                <span className="text-[0.68rem] text-[#94a0b1]">
                  {usesSpontaneousRoadGuidance
                    ? `${roadGuidanceLines.length}단계`
                    : `${transit.segments.length}구간`}
                </span>
              </div>

              {usesSpontaneousRoadGuidance ? (
                <ol className="max-h-72 space-y-1 overflow-y-auto pr-1 text-xs scrollbar-none">
                  {roadGuidanceLines.map((routeLine, index) => (
                    <RoadGuidanceDetail
                      key={`${routeLine.routeOrder}-${routeLine.lineOrder}`}
                      routeLine={routeLine}
                      index={index}
                      emphasized
                    />
                  ))}
                </ol>
              ) : (
                <ol className="max-h-72 space-y-3 overflow-y-auto pr-1 text-xs scrollbar-none">
                  {transit.segments.map((segment) => (
                    <SegmentDetail key={`${segment.order}-${segment.mode}`} segment={segment} />
                  ))}
                </ol>
              )}
            </div>
          )}
        </details>

        {warnings.map((warning) => (
          <p key={warning} className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {warning}
          </p>
        ))}
      </div>
    );
  }

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
        {providerLabel && <span>{providerLabel}</span>}
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
