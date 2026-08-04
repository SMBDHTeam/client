"use client";

import { useEffect, useRef } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";
maptilersdk.config.primaryLanguage = maptilersdk.Language.KOREAN;

const BUSAN_CENTER: [number, number] = [129.0756, 35.1796];

export type MapTiler3DMarker = {
  id?: number;
  lat: number;
  lng: number;
  label: string;
  order?: number;
  color?: string;
  added?: boolean;
  icon?: string;
};

export default function MapTiler3D({
  center,
  zoom = 14,
  markers = [],
  activeMarkerId = null,
  onMarkerSelect,
  className,
}: {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapTiler3DMarker[];
  activeMarkerId?: number | null;
  onMarkerSelect?: (id: number | null) => void;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);
  const skipNextFlyTo = useRef(true);
  const prevActiveIdRef = useRef<number | null>(null);
  const initialViewRef = useRef<{ center: [number, number]; zoom: number } | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const startCenter: [number, number] = center
      ? [center.lng, center.lat]
      : BUSAN_CENTER;

    const map =
      markers.length > 1
        ? new maptilersdk.Map({
            container: mapRef.current,
            style: maptilersdk.MapStyle.STREETS_V4,
            bounds: markers.reduce(
              (b, m) => b.extend([m.lng, m.lat]),
              new maptilersdk.LngLatBounds(),
            ),
            fitBoundsOptions: { padding: 64, maxZoom: 17 },
            pitch: 55,
            bearing: -15,
          })
        : new maptilersdk.Map({
            container: mapRef.current,
            style: maptilersdk.MapStyle.STREETS_V4,
            center: startCenter,
            zoom,
            pitch: 55,
            bearing: -15,
          });

    const initialCenter = map.getCenter();
    initialViewRef.current = {
      center: [initialCenter.lng, initialCenter.lat],
      zoom: map.getZoom(),
    };

    map.on("load", () => {
      map.addLayer({
        id: "buildings-3d",
        source: "openmaptiles",
        "source-layer": "building",
        type: "fill-extrusion",
        minzoom: 12,
        paint: {
          "fill-extrusion-color": "#c9b99a",
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 10],
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.85,
        },
      });
    });

    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !center) return;
    if (skipNextFlyTo.current) {
      skipNextFlyTo.current = false;
      return;
    }
    map.flyTo({ center: [center.lng, center.lat], zoom, pitch: 55, essential: true });
  }, [center?.lat, center?.lng, zoom]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const addMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (markers.length === 0) return;

      const bounds = new maptilersdk.LngLatBounds();
      let activeEntry: { marker: maptilersdk.Marker; m: MapTiler3DMarker } | null = null;

      markers.forEach((m) => {
        const color = m.added ? "#17B89B" : (m.color ?? "#2E7DF2");
        const interactive = m.id != null;

        const el = document.createElement("div");
        el.style.cssText = `display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 3px rgba(0,0,0,0.3));${
          interactive ? "cursor:pointer;" : ""
        }`;

        const head = document.createElement("div");
        head.style.cssText = `
          width:26px;height:26px;border-radius:50%;
          background:${color};
          border:2px solid #fff;
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:12px;font-weight:700;
        `;
        head.innerHTML = m.added
          ? "✓"
          : m.icon
            ? m.icon
            : m.order != null
              ? String(m.order)
              : "";

        const tail = document.createElement("div");
        tail.style.cssText = `
          width:0;height:0;margin-top:-2px;
          border-left:6px solid transparent;
          border-right:6px solid transparent;
          border-top:9px solid ${color};
        `;

        el.appendChild(head);
        el.appendChild(tail);

        const marker = new maptilersdk.Marker({ element: el, anchor: "bottom" })
          .setLngLat([m.lng, m.lat])
          .addTo(map);

        if (interactive) {
          el.addEventListener("click", () => onMarkerSelect?.(m.id ?? null));
        } else {
          const popup = new maptilersdk.Popup({ offset: 20, closeButton: false }).setHTML(
            `<div style="font-size:12px;font-weight:700;color:#0f172a;padding:2px 4px">${m.label}</div>`,
          );
          marker.setPopup(popup);
          el.addEventListener("mouseenter", () => marker.togglePopup());
          el.addEventListener("mouseleave", () => marker.togglePopup());
        }

        markersRef.current.push(marker);
        bounds.extend([m.lng, m.lat]);

        if (interactive && m.id === activeMarkerId) {
          activeEntry = { marker, m };
        }
      });

      const anyInteractive = markers.some((m) => m.id != null);

      if (activeEntry) {
        const { m } = activeEntry as { marker: maptilersdk.Marker; m: MapTiler3DMarker };
        map.flyTo({ center: [m.lng, m.lat], zoom: 17, pitch: 55, essential: true });
      } else if (anyInteractive && prevActiveIdRef.current != null) {
        const restore = initialViewRef.current;
        if (restore) {
          map.flyTo({ center: restore.center, zoom: restore.zoom, pitch: 55, essential: true });
        } else if (center) {
          map.flyTo({ center: [center.lng, center.lat], zoom, pitch: 55, essential: true });
        }
      } else if (!anyInteractive && markers.length > 1) {
        map.fitBounds(bounds, { padding: 64, pitch: 55, maxZoom: 17, animate: false });
      }

      prevActiveIdRef.current = activeMarkerId ?? null;
    };

    if (map.loaded()) addMarkers();
    else map.once("load", addMarkers);
  }, [markers, activeMarkerId, onMarkerSelect, center, zoom]);

  return <div ref={mapRef} className={className} />;
}
