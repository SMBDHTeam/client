"use client";

/* The Naver Maps browser SDK is loaded dynamically and has no local type declarations. */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

let naverMapsPromise: Promise<void> | null = null;

function loadNaverMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.naver?.maps?.Map) return Promise.resolve();
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
};

type RouteLine = {
  mode: "WALK" | "BUS" | "SUBWAY" | "TRAIN";
  coordinates: [number, number][];
};

type EndpointMarker = {
  name: string;
  lat: number;
  lng: number;
};

type TransferPoint = EndpointMarker & {
  mode: RouteLine["mode"];
  lineName: string | null;
};

const ROUTE_COLORS: Record<RouteLine["mode"], string> = {
  WALK: "#71717A",
  BUS: "#2E7DF2",
  SUBWAY: "#17B89B",
  TRAIN: "#8B5CF6",
};

export default function NaverMap({
  center = BUSAN_CENTER,
  place,
  onAddPlace,
  route,
  routeLines,
  transferPoints,
  startMarker,
  endMarker,
  activeOrder,
  className,
  showAddAction = true,
  showMarker = true,
}: {
  center?: { lat: number; lng: number };
  place?: { name: string; tag: string; alreadyAdded: boolean } | null;
  onAddPlace?: () => void;
  route?: RoutePoint[];
  routeLines?: RouteLine[];
  transferPoints?: TransferPoint[];
  startMarker?: EndpointMarker | null;
  endMarker?: EndpointMarker | null;
  activeOrder?: number;
  className?: string;
  showAddAction?: boolean;
  showMarker?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const routeOverlaysRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadNaverMaps()
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !mapRef.current || !window.naver) return;

    const container = mapRef.current;

    function createMap() {
      if (mapInstanceRef.current) return;
      if (!window.naver?.maps?.Map || !window.naver.maps.LatLng) return;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

      mapInstanceRef.current = new window.naver.maps.Map(container, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: 12,
      });
      setMapReady(true);
    }

    createMap();

    const observer = new ResizeObserver(() => {
      createMap();
      if (mapInstanceRef.current && window.naver?.maps?.Event) {
        window.naver.maps.Event.trigger(mapInstanceRef.current, "resize");
      }
    });
    observer.observe(container);

    function detectMapError() {
      const style = container.getAttribute("style") ?? "";
      if (container.textContent?.includes("인증에 실패") || style.includes("auth_fail")) {
        setMapError(true);
      }
    }
    const errorObserver = new MutationObserver(detectMapError);
    errorObserver.observe(container, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true,
    });
    detectMapError();

    return () => {
      observer.disconnect();
      errorObserver.disconnect();
      mapInstanceRef.current = null;
      markerRef.current = null;
      infoWindowRef.current = null;
      routeOverlaysRef.current = [];
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  useEffect(() => {
    if (!mapReady || mapError || route || !window.naver?.maps?.LatLng) return;

    if (!showMarker) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      infoWindowRef.current?.close();
      return;
    }

    const map = mapInstanceRef.current;
    const position = new window.naver.maps.LatLng(center.lat, center.lng);
    if (!markerRef.current) {
      markerRef.current = new window.naver.maps.Marker({ position, map });
    } else {
      markerRef.current.setPosition(position);
    }
    map.panTo(position);
  }, [mapReady, mapError, center.lat, center.lng, route, showMarker]);

  useEffect(() => {
    if (!mapReady || mapError || !markerRef.current || !window.naver?.maps?.InfoWindow) return;

    if (!place) {
      infoWindowRef.current?.close();
      return;
    }

    const content = document.createElement("div");
    content.style.cssText =
      "padding:10px 12px;width:170px;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.18);";

    const title = document.createElement("p");
    title.textContent = place.name;
    title.style.cssText =
      "margin:0 0 2px;font-size:13px;font-weight:600;color:#18181b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

    const tag = document.createElement("p");
    tag.textContent =
      place.tag.length > 18 ? `${place.tag.slice(0, 18)}…` : place.tag;
    tag.style.cssText =
      "margin:0 0 8px;font-size:11px;color:#a1a1aa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";

    content.append(title, tag);

    if (showAddAction) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = place.alreadyAdded ? "담음" : "+ 추가";
      button.disabled = place.alreadyAdded;
      button.style.cssText = `width:100%;padding:6px 0;border:none;border-radius:9999px;font-size:12px;font-weight:600;cursor:${
        place.alreadyAdded ? "default" : "pointer"
      };background:${place.alreadyAdded ? "#f4f4f5" : "#EAF2FE"};color:${
        place.alreadyAdded ? "#a1a1aa" : "#2E7DF2"
      };`;
      button.onclick = () => onAddPlace?.();
      content.append(button);
    } else {
      tag.style.marginBottom = "0";
    }

    if (!infoWindowRef.current) {
      infoWindowRef.current = new window.naver.maps.InfoWindow({
        content,
        borderWidth: 0,
        backgroundColor: "transparent",
        disableAnchor: true,
      });
    } else {
      infoWindowRef.current.setContent(content);
    }
    infoWindowRef.current.open(mapInstanceRef.current, markerRef.current);
  }, [mapReady, mapError, place, onAddPlace, showAddAction]);

  useEffect(() => {
    if (
      !mapReady ||
      mapError ||
      (!route || route.length === 0) ||
      !window.naver?.maps?.LatLng
    ) return;
    const map = mapInstanceRef.current;

    routeOverlaysRef.current.forEach((o) => o.setMap(null));
    routeOverlaysRef.current = [];

    const markerLatLngs = route.map(
      (p) => new window.naver.maps.LatLng(p.lat, p.lng),
    );
    const serverLines = routeLines?.filter((line) => line.coordinates.length >= 2) ?? [];
    const pathLatLngs: any[] = [];

    if (serverLines.length > 0) {
      serverLines.forEach((line) => {
        const path = line.coordinates.map(([longitude, latitude]) => {
          const point = new window.naver.maps.LatLng(latitude, longitude);
          pathLatLngs.push(point);
          return point;
        });
        routeOverlaysRef.current.push(
          new window.naver.maps.Polyline({
            map,
            path,
            strokeColor: ROUTE_COLORS[line.mode],
            strokeWeight: line.mode === "WALK" ? 3 : 5,
            strokeStyle: line.mode === "WALK" ? "shortdash" : "solid",
            strokeOpacity: 0.9,
          }),
        );
      });
    } else if (markerLatLngs.length >= 2) {
      routeOverlaysRef.current.push(
        new window.naver.maps.Polyline({
          map,
          path: markerLatLngs,
          strokeColor: "#2E7DF2",
          strokeStyle: "shortdash",
          strokeWeight: 3,
          strokeOpacity: 0.9,
        }),
      );
    }

    route.forEach((p) => {
      const duplicatesEndpoint = [startMarker, endMarker].some(
        (endpoint) =>
          endpoint &&
          Math.abs(endpoint.lat - p.lat) < 0.0000001 &&
          Math.abs(endpoint.lng - p.lng) < 0.0000001,
      );
      if (duplicatesEndpoint) return;
      const active = activeOrder === p.order;
      const size = active ? 42 : 34;
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(p.lat, p.lng),
        zIndex: active ? 100 : 10,
        map,
        icon: {
          content: `<div style="position:relative;width:${size}px;height:${size}px;">
            <div style="width:${size}px;height:${size}px;background:${p.color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 6px rgba(0,0,0,0.28);border:2px solid #fff;"></div>
            <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:${active ? 15 : 13}px;font-weight:700;">${p.order}</span>
          </div>`,
          anchor: new window.naver.maps.Point(size / 2, size),
        },
      });
      routeOverlaysRef.current.push(marker);
    });

    const endpointPoints: any[] = [];
    const transferLatLngs = (transferPoints ?? []).map((point) => {
      const position = new window.naver.maps.LatLng(point.lat, point.lng);
      const modeLabel = point.mode === "SUBWAY" ? "지하철" : point.mode === "TRAIN" ? "열차" : "버스";
      routeOverlaysRef.current.push(
        new window.naver.maps.Marker({
          position,
          zIndex: 110,
          map,
          title: `${point.name} · ${modeLabel}${point.lineName ? ` ${point.lineName}` : ""}`,
          icon: {
            content: '<div style="display:grid;width:34px;height:34px;place-items:center;border:3px solid #fff;border-radius:50%;background:#F59E0B;color:#fff;font-size:10px;font-weight:800;box-shadow:0 3px 8px rgba(0,0,0,.28)">환승</div>',
            anchor: new window.naver.maps.Point(17, 17),
          },
        }),
      );
      return position;
    });
    if (startMarker) {
      const position = new window.naver.maps.LatLng(startMarker.lat, startMarker.lng);
      endpointPoints.push(position);
      routeOverlaysRef.current.push(
        new window.naver.maps.Marker({
          position,
          zIndex: 80,
          map,
          title: `출발 · ${startMarker.name}`,
          icon: {
            content: '<div style="display:grid;width:34px;height:34px;place-items:center;border:3px solid #fff;border-radius:50%;background:#18181b;color:#fff;font-size:11px;font-weight:800;box-shadow:0 3px 8px rgba(0,0,0,.28)">출발</div>',
            anchor: new window.naver.maps.Point(17, 17),
          },
        }),
      );
    }
    if (endMarker) {
      const position = new window.naver.maps.LatLng(endMarker.lat, endMarker.lng);
      endpointPoints.push(position);
      routeOverlaysRef.current.push(
        new window.naver.maps.Marker({
          position,
          zIndex: 90,
          map,
          title: `도착 · ${endMarker.name}`,
          icon: {
            content: '<div style="position:relative;width:30px;height:38px"><span style="position:absolute;left:5px;top:2px;width:3px;height:32px;background:#18181b"></span><span style="position:absolute;left:8px;top:3px;width:18px;height:13px;background:#fff;border:2px solid #18181b"></span><span style="position:absolute;left:1px;bottom:0;width:12px;height:5px;border-radius:50%;background:#18181b"></span></div>',
            anchor: new window.naver.maps.Point(7, 38),
          },
        }),
      );
    }

    const bounds = new window.naver.maps.LatLngBounds();
    [...markerLatLngs, ...pathLatLngs, ...endpointPoints, ...transferLatLngs].forEach((point: any) => bounds.extend(point));
    map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });

    return () => {
      routeOverlaysRef.current.forEach((o) => o.setMap(null));
      routeOverlaysRef.current = [];
    };
  }, [mapReady, mapError, route, routeLines, transferPoints, startMarker, endMarker, activeOrder]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={mapRef} className="h-full w-full" />
      {mapError && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-zinc-100 px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-zinc-600">지도를 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs text-zinc-400">지도 API 설정을 확인해 주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
