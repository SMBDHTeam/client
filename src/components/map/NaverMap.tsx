"use client";

import { useEffect, useRef, useState } from "react";

type NaverLatLng = object;

type NaverMapInstance = {
  fitBounds: (bounds: NaverLatLngBounds, padding: Record<string, number>) => void;
  getZoom: () => number;
  morph: (
    position: NaverLatLng,
    zoom: number,
    options?: { duration: number; easing: string },
  ) => void;
  panTo: (position: NaverLatLng) => void;
};

type NaverOverlay = {
  setMap: (map: NaverMapInstance | null) => void;
};

type NaverMarker = NaverOverlay & {
  getPosition: () => NaverLatLng;
  setPosition: (position: NaverLatLng) => void;
};

type NaverInfoWindow = {
  close: () => void;
  open: (map: NaverMapInstance, marker: NaverMarker) => void;
  setContent: (content: HTMLElement) => void;
};

type NaverLatLngBounds = {
  extend: (position: NaverLatLng) => void;
};

type NaverMapsApi = {
  Event: {
    addListener: (marker: NaverMarker, eventName: string, listener: () => void) => void;
    trigger: (map: NaverMapInstance, eventName: string) => void;
  };
  InfoWindow: new (options: Record<string, unknown>) => NaverInfoWindow;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  LatLngBounds: new () => NaverLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: { center: NaverLatLng; zoom: number },
  ) => NaverMapInstance;
  Marker: new (options: Record<string, unknown>) => NaverMarker;
  Point: new (x: number, y: number) => object;
  Polyline: new (options: Record<string, unknown>) => NaverOverlay;
};

declare global {
  interface Window {
    naver?: { maps: NaverMapsApi };
  }
}

const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

let naverMapsPromise: Promise<void> | null = null;

function loadNaverMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.naver?.maps) return Promise.resolve();
  if (naverMapsPromise) return naverMapsPromise;

  naverMapsPromise = new Promise<void>((resolve, reject) => {
    const src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`;
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("네이버 지도 스크립트 로드 실패")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("네이버 지도 스크립트 로드 실패"));
    document.head.appendChild(script);
  });
  return naverMapsPromise;
}

type RoutePoint = {
  lat: number;
  lng: number;
  order: number;
  color: string;
  label?: string;
  tag?: string;
  added?: boolean;
  icon?: string;
};

export type RouteLineSegment = {
  mode: string;
  lineName?: string | null;
  coordinates: [number, number][];
};

export type TransferPoint = {
  name: string;
  lat: number;
  lng: number;
  mode: string;
  lineName?: string | null;
};

export type MapMarker = {
  name: string;
  lat: number;
  lng: number;
};

const PATH_STYLE: Record<
  string,
  { color: string; style: string; weight: number }
> = {
  WALK: { color: "#9CA3AF", style: "shortdash", weight: 4 },
  BUS: { color: "#2E7DF2", style: "solid", weight: 5 },
  SUBWAY: { color: "#F59E0B", style: "solid", weight: 5 },
  TRAIN: { color: "#8B5CF6", style: "solid", weight: 5 },
  CAR: { color: "#E85D75", style: "solid", weight: 5 },
};

const EMPTY_ROUTE_LINES: RouteLineSegment[] = [];
const EMPTY_TRANSFER_POINTS: TransferPoint[] = [];

export default function NaverMap({
  center = BUSAN_CENTER,
  zoom,
  place,
  onAddPlace,
  route,
  routeLines = EMPTY_ROUTE_LINES,
  transferPoints = EMPTY_TRANSFER_POINTS,
  startMarker = null,
  endMarker = null,
  activeOrder,
  showRouteLine = true,
  activeRouteOrder = null,
  onRouteMarkerSelect,
  onRouteMarkerAdd,
  className,
}: {
  center?: { lat: number; lng: number };
  zoom?: number;
  place?: { name: string; tag: string; alreadyAdded: boolean } | null;
  onAddPlace?: () => void;
  route?: RoutePoint[];
  routeLines?: RouteLineSegment[];
  transferPoints?: TransferPoint[];
  startMarker?: MapMarker | null;
  endMarker?: MapMarker | null;
  activeOrder?: number;
  showRouteLine?: boolean;
  activeRouteOrder?: number | null;
  onRouteMarkerSelect?: (order: number | null) => void;
  onRouteMarkerAdd?: (order: number) => void;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<NaverMapInstance | null>(null);
  const markerRef = useRef<NaverMarker | null>(null);
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const routeOverlaysRef = useRef<NaverOverlay[]>([]);
  const routeInfoWindowRef = useRef<NaverInfoWindow | null>(null);
  const initialCenterRef = useRef(center);
  const initialZoomRef = useRef(zoom);
  const [mapReady, setMapReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadNaverMaps()
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (!scriptReady || !mapRef.current || !maps) return;

    const mapApi: NaverMapsApi = maps;
    const container = mapRef.current;
    const initialCenter = initialCenterRef.current;
    const initialZoom = initialZoomRef.current;

    function createMap() {
      if (mapInstanceRef.current) return;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

      mapInstanceRef.current = new mapApi.Map(container, {
        center: new mapApi.LatLng(initialCenter.lat, initialCenter.lng),
        zoom: initialZoom ?? 12,
      });
      setMapReady(true);
    }

    createMap();

    const observer = new ResizeObserver(() => {
      createMap();
      if (mapInstanceRef.current) {
        mapApi.Event.trigger(mapInstanceRef.current, "resize");
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      mapInstanceRef.current = null;
      markerRef.current = null;
      infoWindowRef.current = null;
      routeOverlaysRef.current = [];
      setMapReady(false);
    };
  }, [scriptReady]);

  useEffect(() => {
    if (!mapReady || route) return;
    const map = mapInstanceRef.current;
    const maps = window.naver?.maps;
    if (!map || !maps) return;
    const position = new maps.LatLng(center.lat, center.lng);
    if (!markerRef.current) {
      markerRef.current = new maps.Marker({ position, map });
    } else {
      markerRef.current.setPosition(position);
    }
    if (typeof zoom === "number") {
      map.morph(position, zoom);
    } else {
      map.panTo(position);
    }
  }, [mapReady, center.lat, center.lng, zoom, route]);

  const hasPlace = place != null;
  const placeName = place?.name ?? "";
  const placeTag = place?.tag ?? "";
  const placeAlreadyAdded = place?.alreadyAdded ?? false;

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapInstanceRef.current;
    if (!mapReady || !markerRef.current || !maps || !map) return;

    if (!hasPlace) {
      infoWindowRef.current?.close();
      return;
    }

    const content = document.createElement("div");
    content.style.cssText =
      "padding:10px 12px;width:170px;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.18);";

    const title = document.createElement("p");
    title.textContent = placeName;
    title.style.cssText =
      "margin:0 0 2px;font-size:13px;font-weight:600;color:#18181b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

    const tag = document.createElement("p");
    tag.textContent =
      placeTag.length > 18 ? `${placeTag.slice(0, 18)}…` : placeTag;
    tag.style.cssText =
      "margin:0 0 8px;font-size:11px;color:#a1a1aa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = placeAlreadyAdded ? "담음" : "+ 추가";
    button.disabled = placeAlreadyAdded;
    button.style.cssText = `width:100%;padding:6px 0;border:none;border-radius:9999px;font-size:12px;font-weight:600;cursor:${
      placeAlreadyAdded ? "default" : "pointer"
    };background:${placeAlreadyAdded ? "#f4f4f5" : "#EAF2FE"};color:${
      placeAlreadyAdded ? "#a1a1aa" : "#2E7DF2"
    };`;
    button.onclick = () => onAddPlace?.();

    content.append(title, tag, button);

    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow({
        content,
        borderWidth: 0,
        backgroundColor: "transparent",
        disableAnchor: true,
      });
    } else {
      infoWindowRef.current.setContent(content);
    }
    infoWindowRef.current.open(map, markerRef.current);
  }, [hasPlace, mapReady, onAddPlace, placeAlreadyAdded, placeName, placeTag]);

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapInstanceRef.current;
    if (!mapReady || !maps || !map) return;
    const mapApi: NaverMapsApi = maps;
    const activeMap: NaverMapInstance = map;
    const routePoints = route ?? [];
    const hasOverlayData =
      routePoints.length > 0 ||
      routeLines.length > 0 ||
      transferPoints.length > 0 ||
      startMarker != null ||
      endMarker != null;

    routeOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    routeOverlaysRef.current = [];
    if (!hasOverlayData) return;

    const bounds = new maps.LatLngBounds();
    let hasBounds = false;
    function extendBounds(lat: number, lng: number) {
      bounds.extend(new mapApi.LatLng(lat, lng));
      hasBounds = true;
    }
    routePoints.forEach((point) => extendBounds(point.lat, point.lng));

    if (showRouteLine) {
      routeLines.forEach((segment) => {
        if (
          segment.coordinates.length < 2 ||
          segment.coordinates.some((coordinate) => !coordinate.every(Number.isFinite))
        ) return;
        const style = PATH_STYLE[segment.mode] ?? PATH_STYLE.BUS;
        const path = segment.coordinates.map(([lng, lat]) => {
          const coordinate = new maps.LatLng(lat, lng);
          bounds.extend(coordinate);
          hasBounds = true;
          return coordinate;
        });
        const line = new maps.Polyline({
          map,
          path,
          strokeColor: style.color,
          strokeStyle: style.style,
          strokeWeight: style.weight,
          strokeOpacity: 0.9,
          strokeLineCap: "round",
          strokeLineJoin: "round",
        });
        routeOverlaysRef.current.push(line);
      });
    }

    function openRouteInfo(p: RoutePoint, marker: NaverMarker) {
      if (!p.label) return;

      const content = document.createElement("div");
      content.style.cssText =
        "padding:10px 12px;width:170px;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.18);";

      const title = document.createElement("p");
      title.textContent = p.label;
      title.style.cssText =
        "margin:0 0 2px;font-size:13px;font-weight:600;color:#18181b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
      content.appendChild(title);

      if (p.tag) {
        const tag = document.createElement("p");
        tag.textContent = p.tag.length > 18 ? `${p.tag.slice(0, 18)}…` : p.tag;
        tag.style.cssText =
          "margin:0 0 8px;font-size:11px;color:#a1a1aa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
        content.appendChild(tag);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = p.added ? "담음" : "+ 추가";
      button.disabled = !!p.added;
      button.style.cssText = `width:100%;padding:6px 0;border:none;border-radius:9999px;font-size:12px;font-weight:600;cursor:${
        p.added ? "default" : "pointer"
      };background:${p.added ? "#f4f4f5" : "#EAF2FE"};color:${
        p.added ? "#a1a1aa" : "#2E7DF2"
      };`;
      button.onclick = () => onRouteMarkerAdd?.(p.order);
      content.appendChild(button);

      if (!routeInfoWindowRef.current) {
        routeInfoWindowRef.current = new mapApi.InfoWindow({
          content,
          borderWidth: 0,
          backgroundColor: "transparent",
          disableAnchor: true,
        });
      } else {
        routeInfoWindowRef.current.setContent(content);
      }
      routeInfoWindowRef.current.open(activeMap, marker);
    }

    const routeMarkers: Array<{ point: RoutePoint; marker: NaverMarker }> = [];

    routePoints.forEach((p) => {
      const active = activeOrder === p.order;
      const size = active ? 32 : 26;
      const tailH = 9;
      const position = new maps.LatLng(p.lat, p.lng);
      const marker = new maps.Marker({
        position,
        zIndex: active ? 100 : 10,
        map,
        icon: {
          content: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));${
            p.label ? "cursor:pointer;" : ""
          }">
            <div style="width:${size}px;height:${size}px;border-radius:50%;background:${p.color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${
              active ? 14 : 12
            }px;font-weight:700;">${p.added ? "✓" : (p.icon ?? p.order)}</div>
            <div style="width:0;height:0;margin-top:-2px;border-left:6px solid transparent;border-right:6px solid transparent;border-top:${tailH}px solid ${p.color};"></div>
          </div>`,
          anchor: new maps.Point(size / 2, size + tailH - 2),
        },
      });
      if (p.label) {
        maps.Event.addListener(marker, "click", () =>
          onRouteMarkerSelect?.(p.order),
        );
      }
      routeMarkers.push({ point: p, marker });
      routeOverlaysRef.current.push(marker);
    });

    function addAuxiliaryMarker(
      marker: MapMarker,
      label: string,
      color: string,
      zIndex: number,
    ) {
      extendBounds(marker.lat, marker.lng);
      const overlay = new mapApi.Marker({
        position: new mapApi.LatLng(marker.lat, marker.lng),
        title: marker.name,
        zIndex,
        map,
        icon: {
          content:
            '<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.28));">' +
            '<div style="min-width:28px;height:28px;padding:0 6px;border-radius:14px;background:' +
            color +
            ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;">' +
            label +
            "</div></div>",
          anchor: new mapApi.Point(14, 14),
        },
      });
      routeOverlaysRef.current.push(overlay);
    }

    if (startMarker) {
      addAuxiliaryMarker(startMarker, "출발", "#18181B", 80);
    }

    transferPoints.forEach((point, index) => {
      addAuxiliaryMarker(
        { name: point.name, lat: point.lat, lng: point.lng },
        "환" + (index + 1),
        PATH_STYLE[point.mode]?.color ?? "#6B7280",
        70,
      );
    });

    const duplicatesRoutePoint =
      endMarker &&
      routePoints.some(
        (point) =>
          Math.abs(point.lat - endMarker.lat) < 0.0000001 &&
          Math.abs(point.lng - endMarker.lng) < 0.0000001,
      );
    if (endMarker && !duplicatesRoutePoint) {
      addAuxiliaryMarker(endMarker, "도착", "#E85D75", 80);
    }

    const interactive = routePoints.some((p) => p.label);
    const activeEntry = routeMarkers.find(
      ({ point }) => point.order === activeRouteOrder,
    );

    if (activeEntry) {
      map.morph(activeEntry.marker.getPosition(), Math.max(map.getZoom(), 16), {
        duration: 400,
        easing: "easeOutCubic",
      });
      openRouteInfo(activeEntry.point, activeEntry.marker);
    } else if (interactive) {
      routeInfoWindowRef.current?.close();
      const restorePos = new maps.LatLng(center.lat, center.lng);
      map.morph(restorePos, zoom ?? map.getZoom(), {
        duration: 600,
        easing: "easeOutCubic",
      });
    } else if (hasBounds) {
      map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
    } else {
      map.morph(new maps.LatLng(center.lat, center.lng), zoom ?? map.getZoom());
    }

    return () => {
      routeOverlaysRef.current.forEach((o) => o.setMap(null));
      routeOverlaysRef.current = [];
    };
  }, [
    activeOrder,
    activeRouteOrder,
    center.lat,
    center.lng,
    endMarker,
    mapReady,
    onRouteMarkerAdd,
    onRouteMarkerSelect,
    route,
    routeLines,
    showRouteLine,
    startMarker,
    transferPoints,
    zoom,
  ]);

  return <div ref={mapRef} className={className} />;
}
