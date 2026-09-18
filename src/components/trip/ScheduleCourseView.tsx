"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NaverMap from "@/components/map/NaverMap";
import TransitPanel from "@/components/trip/TransitPanel";
import {
  hasPublicTransit,
  renderableRouteLines,
  routeDistanceKm,
  routeLinesForOrder,
  transferPointsForRoute,
} from "@/lib/schedule-course";
import type { ScheduleTransit } from "@/types/api/schedule";
import type { ScheduleRouteLine } from "@/types/api/schedule-map";

const MARKER_COLORS = ["#2E7DF2", "#17B89B", "#F59E0B", "#E85D75", "#8B7DF2"];
const CARD_GRADIENTS = [
  "from-[#2E7DF2] to-[#17B89B]",
  "from-[#F7A18E] to-[#F16E5E]",
  "from-[#8B7DF2] to-[#5B5EE8]",
  "from-[#17B89B] to-[#2E9A6D]",
  "from-[#F59E0B] to-[#EF4444]",
];

export type ScheduleCoursePlace = {
  id: string;
  placeId: number | null;
  order: number;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  arrivalTime: string | null;
  title: string;
  categoryLabel: string | null;
  stayMinutes: number;
  inboundTransit: ScheduleTransit | null;
  mealLabel?: string | null;
  waitingMinutesBefore?: number;
  warnings?: string[];
};

export type ScheduleCourseMarker = {
  name: string;
  latitude: number;
  longitude: number;
};

type ScheduleCourseViewProps = {
  places: ScheduleCoursePlace[];
  routeLines: ScheduleRouteLine[];
  startMarker: ScheduleCourseMarker | null;
  endMarker?: ScheduleCourseMarker | null;
  finalTransit: ScheduleTransit | null;
  finalTransitTitle?: string;
  returnSummary?: string | null;
  returnArrivalLabel?: string | null;
  publicTransitOnly?: boolean;
  heading?: string;
  emptyMessage?: string;
  onPlaceDetail?: (placeId: number) => void;
  imageUnavailableLabel?: string | null;
  showSpontaneousRoadGuidance?: boolean;
  appearance?: "default" | "spontaneous-result";
};

function hasCoordinates(
  place: ScheduleCoursePlace,
): place is ScheduleCoursePlace & { latitude: number; longitude: number } {
  return (
    place.latitude != null &&
    place.longitude != null &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude)
  );
}

function CourseImage({
  imageUrl,
  gradient,
  unavailableLabel,
}: {
  imageUrl: string | null | undefined;
  gradient: string;
  unavailableLabel: string | null;
}) {
  type ImageStatus = "loading" | "loaded" | "unavailable";

  const [imageStatus, setImageStatus] = useState<ImageStatus>(
    imageUrl ? "loading" : "unavailable",
  );

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (!cancelled) setImageStatus("loaded");
    };
    image.onerror = () => {
      if (!cancelled) setImageStatus("unavailable");
    };
    image.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <div
      className={`absolute inset-0 bg-linear-to-br ${gradient}`}
      style={
        imageStatus === "loaded" && imageUrl
          ? {
              backgroundImage: `url(${JSON.stringify(imageUrl)})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : undefined
      }
      aria-hidden={!unavailableLabel}
    >
      {imageStatus === "unavailable" && unavailableLabel && (
        <div className="relative z-10 flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-white/90">
          {unavailableLabel}
        </div>
      )}
    </div>
  );
}

function sameCoordinates(
  marker: ScheduleCourseMarker | null | undefined,
  place: ScheduleCoursePlace | undefined,
) {
  return Boolean(
    marker &&
      place &&
      hasCoordinates(place) &&
      Math.abs(marker.latitude - place.latitude) < 0.0000001 &&
      Math.abs(marker.longitude - place.longitude) < 0.0000001,
  );
}

export default function ScheduleCourseView({
  places,
  routeLines,
  startMarker,
  endMarker = null,
  finalTransit,
  finalTransitTitle = "마지막 도착지로 이동",
  returnSummary = null,
  returnArrivalLabel = null,
  publicTransitOnly = false,
  heading = "오늘의 코스",
  emptyMessage = "이 날짜에 배정된 장소가 없습니다.",
  onPlaceDetail,
  imageUnavailableLabel = null,
  showSpontaneousRoadGuidance = false,
  appearance = "default",
}: ScheduleCourseViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [animate, setAnimate] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activePlace = places[activeIndex];
  const activeRouteLines = useMemo(
    () => routeLinesForOrder(routeLines, activePlace?.order),
    [activePlace?.order, routeLines],
  );
  const visibleRouteLines = useMemo(
    () => renderableRouteLines(activeRouteLines),
    [activeRouteLines],
  );
  const transferPoints = useMemo(
    () => transferPointsForRoute(activeRouteLines),
    [activeRouteLines],
  );
  const distanceKm = useMemo(() => routeDistanceKm(routeLines), [routeLines]);
  const activeTransit =
    activePlace?.inboundTransit &&
    (!publicTransitOnly || hasPublicTransit(activePlace.inboundTransit))
      ? activePlace.inboundTransit
      : null;
  const visibleFinalTransit =
    finalTransit && (!publicTransitOnly || hasPublicTransit(finalTransit))
      ? finalTransit
      : null;
  const finalRouteLines = useMemo(
    () => routeLinesForOrder(routeLines, finalTransit?.routeOrder),
    [finalTransit?.routeOrder, routeLines],
  );
  const spontaneousResult = appearance === "spontaneous-result";

  const activeRoute = useMemo(() => {
    if (!activePlace || !hasCoordinates(activePlace)) return [];
    const current = {
      lat: activePlace.latitude,
      lng: activePlace.longitude,
      order: activePlace.order,
      color: MARKER_COLORS[activeIndex % MARKER_COLORS.length],
    };
    const previous = places[activeIndex - 1];
    if (!previous || !hasCoordinates(previous)) return [current];
    return [
      {
        lat: previous.latitude,
        lng: previous.longitude,
        order: previous.order,
        color: MARKER_COLORS[(activeIndex - 1) % MARKER_COLORS.length],
      },
      current,
    ];
  }, [activeIndex, activePlace, places]);

  const mapCenter = useMemo(() => {
    const firstLineCoordinate = visibleRouteLines[0]?.coordinates[0];
    if (firstLineCoordinate) {
      return { lat: firstLineCoordinate[1], lng: firstLineCoordinate[0] };
    }
    if (activeIndex === 0 && startMarker) {
      return { lat: startMarker.latitude, lng: startMarker.longitude };
    }
    const firstPoint = activeRoute[0];
    return firstPoint
      ? { lat: firstPoint.lat, lng: firstPoint.lng }
      : null;
  }, [activeIndex, activeRoute, startMarker, visibleRouteLines]);

  const progress = places.length > 1 ? (activeIndex / (places.length - 1)) * 100 : 0;

  useEffect(() => {
    function recalculateOffset() {
      const viewport = viewportRef.current;
      const track = viewport?.firstElementChild as HTMLElement | null;
      const card = track?.firstElementChild as HTMLElement | null;
      if (!viewport || !card) return;
      const step = card.offsetWidth + 12;
      setOffset(viewport.offsetWidth / 2 - activeIndex * step - card.offsetWidth / 2);
    }

    recalculateOffset();
    const frame = requestAnimationFrame(() => setAnimate(true));
    window.addEventListener("resize", recalculateOffset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", recalculateOffset);
    };
  }, [activeIndex, places.length]);

  function goTo(index: number) {
    setActiveIndex(Math.min(places.length - 1, Math.max(0, index)));
  }

  return (
    <>
      {mapCenter && (
        <div className="relative shrink-0">
          <NaverMap
            center={mapCenter}
            route={activeRoute}
            routeLines={visibleRouteLines}
            transferPoints={transferPoints}
            startMarker={
              activeIndex === 0 && startMarker
                ? {
                    name: startMarker.name,
                    lat: startMarker.latitude,
                    lng: startMarker.longitude,
                  }
                : null
            }
            endMarker={
              sameCoordinates(endMarker, activePlace) && endMarker
                ? {
                    name: endMarker.name,
                    lat: endMarker.latitude,
                    lng: endMarker.longitude,
                  }
                : null
            }
            activeOrder={activePlace?.order}
            routeAppearance={spontaneousResult ? "spontaneous-result" : "default"}
            className={`w-full overflow-hidden ${
              spontaneousResult
                ? "h-[19rem] rounded-[1.8rem] border-4 border-white shadow-[0_14px_34px_rgba(34,89,145,0.16)] ring-1 ring-[#dce9f7]"
                : "h-72 rounded-3xl"
            }`}
          />
        </div>
      )}

      <div className={`flex items-end justify-between ${spontaneousResult ? "pt-1" : ""}`}>
        <h2
          className={
            spontaneousResult
              ? "text-[1.35rem] font-extrabold tracking-[-0.045em] text-[#0b2146]"
              : "text-lg font-bold"
          }
        >
          {heading}
        </h2>
        <p className={spontaneousResult ? "text-sm font-medium text-[#8996aa]" : "text-sm text-zinc-400"}>
          {places.length}곳{distanceKm != null ? ` · 약 ${distanceKm.toFixed(1)}km` : ""}
        </p>
      </div>

      {places.length > 0 ? (
        <>
          {activeTransit &&
            (spontaneousResult ? (
              <section className="relative pl-5">
                <span className="absolute top-4 left-0 grid size-3.5 place-items-center rounded-full bg-[#2f7ff2] ring-4 ring-[#e8f2ff]" />
                <span className="absolute top-8 bottom-[-1rem] left-[0.4rem] border-l-2 border-dotted border-[#90bdf6]" />
                <TransitPanel
                  transit={activeTransit}
                  hasRouteGeometry={visibleRouteLines.length > 0}
                  routeLines={activeRouteLines}
                  showSpontaneousRoadGuidance={showSpontaneousRoadGuidance}
                  appearance="spontaneous-result"
                />
              </section>
            ) : (
              <TransitPanel
                transit={activeTransit}
                hasRouteGeometry={visibleRouteLines.length > 0}
                routeLines={activeRouteLines}
                showSpontaneousRoadGuidance={showSpontaneousRoadGuidance}
              />
            ))}

          <div className="relative">
            <div ref={viewportRef} className={`-mx-5 overflow-hidden ${spontaneousResult ? "py-2" : "py-1"}`}>
              <div
                className={`flex gap-3 ${animate ? "transition-transform duration-300 ease-out" : ""}`}
                style={{ transform: `translateX(${offset}px)` }}
              >
                {places.map((place, index) => {
                  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
                  const detailPlaceId = place.placeId;
                  return (
                    <div
                      key={place.id}
                      onClick={() => goTo(index)}
                      className={`shrink-0 cursor-pointer overflow-hidden bg-white text-left ring-1 transition-all duration-300 ${
                        spontaneousResult
                          ? "w-[82%] rounded-[1.75rem] shadow-[0_11px_28px_rgba(36,73,119,0.1)]"
                          : "w-[80%] rounded-3xl shadow-sm"
                      } ${
                        index === activeIndex
                          ? spontaneousResult
                            ? "ring-[3px] ring-[#2f7ff2]"
                            : "ring-2 ring-[#2E7DF2]"
                          : spontaneousResult
                            ? "opacity-55 ring-[#e0e6ee]"
                            : "opacity-60 ring-black/5"
                      }`}
                    >
                      <div
                        className={`relative flex flex-col justify-between overflow-hidden text-white ${
                          spontaneousResult ? "h-44 p-4" : "h-40 p-4"
                        }`}
                      >
                        <CourseImage
                          key={place.imageUrl ?? "fallback"}
                          imageUrl={place.imageUrl}
                          gradient={gradient}
                          unavailableLabel={imageUnavailableLabel}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/30" />

                        <div className="relative flex items-start justify-between">
                          <span
                            className={`grid shrink-0 place-items-center rounded-full font-bold text-white shadow ${
                              spontaneousResult ? "size-9 text-base ring-4 ring-white/20" : "size-7 text-sm"
                            }`}
                            style={{ background: MARKER_COLORS[index % MARKER_COLORS.length] }}
                          >
                            {place.order}
                          </span>
                          <span className="flex items-center gap-1.5">
                            {place.mealLabel && (
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-zinc-900">
                                {place.mealLabel}
                              </span>
                            )}
                            {place.arrivalTime && (
                              <span className={`rounded-full bg-white/90 font-semibold text-zinc-700 ${spontaneousResult ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"}`}>
                                {place.arrivalTime}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="relative">
                          <p className={`truncate font-bold ${spontaneousResult ? "text-lg tracking-[-0.03em]" : "text-base"}`}>
                            {place.title}
                          </p>
                          {place.categoryLabel && (
                            <p className="truncate text-xs text-white/75">{place.categoryLabel}</p>
                          )}
                        </div>
                      </div>

                      <div className={`flex flex-col gap-2 ${spontaneousResult ? "px-4 py-3.5" : "p-3"}`}>
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${spontaneousResult ? "text-sm text-[#65758e]" : "text-xs text-zinc-500"}`}>
                            체류 {Math.abs(place.stayMinutes)}분
                          </p>
                          {detailPlaceId != null && onPlaceDetail && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onPlaceDetail(detailPlaceId);
                              }}
                              className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:bg-zinc-200"
                            >
                              상세보기
                            </button>
                          )}
                        </div>
                        {(place.waitingMinutesBefore ?? 0) > 0 && (
                          <p className="text-xs text-zinc-400">
                            식사 시간까지 {place.waitingMinutesBefore}분 여유
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="이전 장소"
              className="absolute top-1/2 left-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl leading-none text-zinc-700 shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === places.length - 1}
              aria-label="다음 장소"
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl leading-none text-zinc-700 shadow-md backdrop-blur transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0"
            >
              ›
            </button>
          </div>

          <div className={`flex justify-center gap-1.5 ${spontaneousResult ? "-mt-1" : ""}`}>
            {places.map((place, index) => (
              <span
                key={place.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-5 bg-[#2E7DF2]" : "w-1.5 bg-zinc-200"
                }`}
              />
            ))}
          </div>

          <div className={`px-1 ${spontaneousResult ? "mt-3" : "mt-2"}`}>
            <div className={`relative rounded-full bg-zinc-200 ${spontaneousResult ? "h-1.5" : "h-2"}`}>
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-[#2E7DF2] to-[#17B89B]"
                style={{ width: `${progress}%` }}
              />
              <div
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#2E7DF2] bg-white shadow-md ${spontaneousResult ? "size-4.5" : "size-5"}`}
                style={{ left: `${progress}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs text-zinc-400">
              {places.map((place, index) => (
                <span
                  key={place.id}
                  className={index === activeIndex ? "font-bold text-[#2E7DF2]" : ""}
                >
                  {place.arrivalTime ?? "—"}
                </span>
              ))}
            </div>
          </div>

          {activePlace && (activePlace.warnings?.length ?? 0) > 0 && (
            <section className="mt-2 rounded-2xl bg-amber-50 px-4 py-3">
              <h3 className="text-sm font-bold text-amber-900">
                {activePlace.title} 확인 사항
              </h3>
              <ul className="mt-1.5 space-y-1">
                {activePlace.warnings?.map((warning) => (
                  <li key={warning} className="text-xs leading-relaxed text-amber-800">
                    {warning}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visibleFinalTransit && (
            <section className={`mt-2 ${spontaneousResult ? "relative pl-5" : ""}`}>
              {spontaneousResult && (
                <>
                  <span className="absolute top-1 left-0 grid size-3.5 place-items-center rounded-full bg-[#18bba2] ring-4 ring-[#dcf7f1]" />
                  <span className="absolute top-5 bottom-3 left-[0.4rem] border-l-2 border-dotted border-[#75d7c7]" />
                </>
              )}
              <h3
                className={
                  spontaneousResult
                    ? "mb-2.5 text-base font-extrabold tracking-[-0.025em] text-[#16304f]"
                    : "mb-2 text-sm font-bold text-zinc-800"
                }
              >
                {finalTransitTitle}
              </h3>
              <TransitPanel
                transit={visibleFinalTransit}
                hasRouteGeometry={renderableRouteLines(finalRouteLines).length > 0}
                routeLines={finalRouteLines}
                showSpontaneousRoadGuidance={showSpontaneousRoadGuidance}
                appearance={spontaneousResult ? "spontaneous-result" : "default"}
              />
            </section>
          )}

          {(returnSummary || returnArrivalLabel) && (
            <section
              className={
                spontaneousResult
                  ? "rounded-[1.35rem] border border-[#dff4ef] bg-linear-to-r from-[#effaf7] to-[#eaf8fb] px-4 py-3.5"
                  : "rounded-2xl bg-zinc-50 px-4 py-3"
              }
            >
              <p className={`text-xs font-semibold ${spontaneousResult ? "text-[#52796f]" : "text-zinc-500"}`}>
                복귀 정보
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                {returnSummary && (
                  <p className={`text-sm ${spontaneousResult ? "text-[#52677c]" : "text-zinc-600"}`}>
                    {returnSummary}
                  </p>
                )}
                {returnArrivalLabel && (
                  <p className={`ml-auto shrink-0 text-sm font-bold ${spontaneousResult ? "text-[#0aaa90]" : "text-[#17B89B]"}`}>
                    {returnArrivalLabel} 도착 예정
                  </p>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <p className="rounded-2xl bg-zinc-50 py-12 text-center text-sm text-zinc-400">
          {emptyMessage}
        </p>
      )}
    </>
  );
}
