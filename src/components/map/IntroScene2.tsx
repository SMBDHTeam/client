"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Canvas, useThree } from "@react-three/fiber";
import gsap from "gsap";
import nubiWordmark from "@/assets/icons/nubi-wordmark.png";
import { getBBox, calcCentroid } from "@/utils/geoUtils";
import type { District, BBox } from "@/utils/geoUtils";
import { Scene } from "@/components/map/Scene";

type Phase = "assembling" | "ready" | "entering";

function CameraZoomIn({ active, onDone }: { active: boolean; onDone: () => void }) {
  const { camera } = useThree();
  const fired = useRef(false);

  useEffect(() => {
    if (!active || fired.current) return;
    fired.current = true;
    gsap.to(camera.position, {
      z: -8,
      duration: 1.8,
      ease: "power2.in",
      onComplete: onDone,
    });
  }, [active, camera, onDone]);

  return null;
}

export default function IntroScene2({ onEnter }: { onEnter: () => void }) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [phase, setPhase] = useState<Phase>("assembling");
  const [sceneReady, setSceneReady] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    fetch("/busan.json")
      .then((r) => r.json())
      .then((data: { features: any[] }) => {
        const raw = data.features.map((f: any) => ({
          name: f.properties.name,
          code: f.properties.code,
          polygons:
            f.geometry.type === "MultiPolygon"
              ? f.geometry.coordinates
              : [f.geometry.coordinates],
        }));
        const bbox = getBBox(raw);
        const ds = raw.map((d: any) => ({
          ...d,
          centroid: calcCentroid(d.polygons, bbox),
        }));
        setDistricts(ds);
        setBbox(getBBox(ds));
        setTimeout(() => setSceneReady(true), 100);
      });
  }, []);

  useEffect(() => {
    if (!sceneReady || districts.length === 0) return;
    const lastIndex = districts.length - 1;
    const assembleMs = (1.2 + lastIndex * 0.04 + lastIndex * 0.03) * 1000 + 500;
    const timer = setTimeout(() => setPhase("ready"), assembleMs);
    return () => clearTimeout(timer);
  }, [sceneReady, districts.length]);

  const handleLogin = async () => {
    const w = 500,
      h = 600;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
    const popup = window.open(
      "",
      "GoogleLogin",
      `width=${w},height=${h},left=${left},top=${top}`,
    );
    if (popup) {
      const form = popup.document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/signin/google";
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();
      const addField = (name: string, value: string) => {
        const input = popup.document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      addField("csrfToken", csrfToken);
      addField("callbackUrl", `${window.location.origin}/auth-success`);
      popup.document.body.appendChild(form);
      form.submit();
    }

    const onMessage = async (e: MessageEvent) => {
      if (e.data === "auth-success") {
        window.removeEventListener("message", onMessage);
        const { getSession } = await import("next-auth/react");
        await getSession();
        setPhase("entering");
        setTimeout(() => setOverlayOpacity(1), 1400);
      }
    };
    window.addEventListener("message", onMessage);
  };

  // Scene에 "ready"를 넘기면 group이 -90도 회전하므로 항상 "assembling"으로 고정
  const scenePhase = "assembling";

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        background:
          "linear-gradient(160deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: sceneReady ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {bbox && (
          <Canvas
            dpr={[1, 1.5]}
            camera={{ position: [0, 0, 14], fov: 52 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <CameraZoomIn active={phase === "entering"} onDone={onEnter} />
              <Scene
                districts={districts}
                bbox={bbox}
                phase={scenePhase}
                onSelect={() => {}}
                selected={null}
                controlsRef={controlsRef}
              />
            </Suspense>
          </Canvas>
        )}
      </div>

      {/* 빨려들어갈 때 흰 섬광 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#fff",
          opacity: overlayOpacity,
          transition: "opacity 0.45s ease",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {phase === "ready" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              animation: "fadeIn 0.6s ease",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "grid",
                placeItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 8,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.75)",
                }}
              />
              <Image
                src={nubiWordmark}
                alt="누비 - 부산 대중교통 여행 플래너"
                width={160}
                height={160}
                priority
                style={{ position: "relative" }}
              />
            </div>
            <button
              onClick={handleLogin}
              style={{
                pointerEvents: "all",
                cursor: "pointer",
                padding: "14px 28px",
                borderRadius: 50,
                background: "#fff",
                color: "#1a1a2e",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "transform .15s, box-shadow .15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              Google로 시작하기
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
