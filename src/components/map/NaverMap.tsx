"use client";


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

export type RoutePath = {
  mode: string;
  coordinates: [number, number][];
};

const PATH_STYLE: Record<
  string,
  { color: string; style: string; weight: number }
> = {
  WALK: { color: "#9CA3AF", style: "shortdash", weight: 4 },
  BUS: { color: "#2E7DF2", style: "solid", weight: 5 },
  SUBWAY: { color: "#F59E0B", style: "solid", weight: 5 },
};

export default function NaverMap({
  center = BUSAN_CENTER,
  zoom,
  place,
  onAddPlace,
  route,
  paths,
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
  paths?: RoutePath[];
  activeOrder?: number;
  showRouteLine?: boolean;
  activeRouteOrder?: number | null;
  onRouteMarkerSelect?: (order: number | null) => void;
  onRouteMarkerAdd?: (order: number) => void;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const routeOverlaysRef = useRef<any[]>([]);
  const routeInfoWindowRef = useRef<any>(null);
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
    if (!scriptReady || !mapRef.current || !window.naver) return;

    const container = mapRef.current;

    function createMap() {
      if (mapInstanceRef.current) return;
      if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

      mapInstanceRef.current = new window.naver.maps.Map(container, {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: zoom ?? 12,
      });
      setMapReady(true);
    }

    createMap();

    const observer = new ResizeObserver(() => {
      createMap();
      if (mapInstanceRef.current) {
        window.naver.maps.Event.trigger(mapInstanceRef.current, "resize");
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
    const position = new window.naver.maps.LatLng(center.lat, center.lng);
    if (!markerRef.current) {
      markerRef.current = new window.naver.maps.Marker({ position, map });
    } else {
      markerRef.current.setPosition(position);
    }
    if (typeof zoom === "number") {
      map.morph(position, zoom);
    } else {
      map.panTo(position);
    }
  }, [mapReady, center.lat, center.lng, zoom, route]);

  useEffect(() => {
    if (!mapReady || !markerRef.current || !window.naver) return;

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

    content.append(title, tag, button);

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
  }, [mapReady, place?.name, place?.tag, place?.alreadyAdded, onAddPlace]);

  useEffect(() => {
    if (!mapReady || !route || route.length === 0 || !window.naver) return;
    const map = mapInstanceRef.current;

    routeOverlaysRef.current.forEach((o) => o.setMap(null));
    routeOverlaysRef.current = [];

    const latlngs = route.map(
      (p) => new window.naver.maps.LatLng(p.lat, p.lng),
    );

    const bounds = new window.naver.maps.LatLngBounds();
    latlngs.forEach((ll: any) => bounds.extend(ll));

    if (showRouteLine) {
      if (paths && paths.length > 0) {
        paths.forEach((seg) => {
          if (seg.coordinates.length < 2) return;
          const style = PATH_STYLE[seg.mode] ?? PATH_STYLE.BUS;
          const path = seg.coordinates.map(([lng, lat]) => {
            const ll = new window.naver.maps.LatLng(lat, lng);
            bounds.extend(ll);
            return ll;
          });
          const line = new window.naver.maps.Polyline({
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
      } else {
        const polyline = new window.naver.maps.Polyline({
          map,
          path: latlngs,
          strokeColor: "#2E7DF2",
          strokeStyle: "shortdash",
          strokeWeight: 3,
          strokeOpacity: 0.9,
        });
        routeOverlaysRef.current.push(polyline);
      }
    }

    function openRouteInfo(p: RoutePoint, marker: any) {
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
        routeInfoWindowRef.current = new window.naver.maps.InfoWindow({
          content,
          borderWidth: 0,
          backgroundColor: "transparent",
          disableAnchor: true,
        });
      } else {
        routeInfoWindowRef.current.setContent(content);
      }
      routeInfoWindowRef.current.open(map, marker);
    }

    let activeMarker: any = null;
    let activePoint: RoutePoint | null = null;

    route.forEach((p) => {
      const active = activeOrder === p.order;
      const size = active ? 32 : 26;
      const tailH = 9;
      const position = new window.naver.maps.LatLng(p.lat, p.lng);
      const marker = new window.naver.maps.Marker({
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
          anchor: new window.naver.maps.Point(size / 2, size + tailH - 2),
        },
      });
      if (p.label) {
        window.naver.maps.Event.addListener(marker, "click", () =>
          onRouteMarkerSelect?.(p.order),
        );
      }
      if (p.order === activeRouteOrder) {
        activeMarker = marker;
        activePoint = p;
      }
      routeOverlaysRef.current.push(marker);
    });

    const interactive = route.some((p) => p.label);

    if (activeMarker && activePoint) {
      map.morph(activeMarker.getPosition(), Math.max(map.getZoom(), 16), {
        duration: 400,
        easing: "easeOutCubic",
      });
      openRouteInfo(activePoint, activeMarker);
    } else if (interactive) {
      routeInfoWindowRef.current?.close();
      const restorePos = new window.naver.maps.LatLng(center.lat, center.lng);
      map.morph(restorePos, zoom ?? map.getZoom(), {
        duration: 600,
        easing: "easeOutCubic",
      });
    } else {
      map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
    }

    return () => {
      routeOverlaysRef.current.forEach((o) => o.setMap(null));
      routeOverlaysRef.current = [];
    };
  }, [mapReady, route, paths, activeOrder, activeRouteOrder, onRouteMarkerAdd, onRouteMarkerSelect]);

  return <div ref={mapRef} className={className} />;
}
