"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { Canvas, useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import gsap from "gsap";
import nubiLogo from "@/assets/icons/header/nubi-logo.png";
import { getBBox, calcCentroid } from "@/utils/geoUtils";
import type { District, BBox, Polygon } from "@/utils/geoUtils";
import { Scene } from "@/components/map/Scene";
import styles from "./IntroScene2.module.css";

type Phase = "assembling" | "ready" | "entering";

const LOGIN_DISTRICT_COLORS = [
  "#2F84C8",
  "#256FB5",
  "#3C91CF",
  "#5BB4D9",
  "#3BCBC3",
  "#2B7FC0",
  "#388FCA",
  "#2D75B5",
  "#1F63A5",
  "#1B5B9A",
  "#337FBE",
  "#174F8E",
  "#45A4D3",
  "#2D79B8",
  "#2467A4",
  "#246FAF",
] as const;

type BusanFeature = {
  properties: { name: string; code: string };
  geometry:
    | { type: "MultiPolygon"; coordinates: Polygon[] }
    | { type: "Polygon"; coordinates: Polygon };
};

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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="28" height="28" viewBox="0 0 48 48">
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
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function IntroScene2({ onEnter }: { onEnter: () => void }) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [phase, setPhase] = useState<Phase>("assembling");
  const [sceneReady, setSceneReady] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [loginPending, setLoginPending] = useState(false);
  const [loginError, setLoginError] = useState("");
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const loginCleanupRef = useRef<(() => void) | null>(null);
  const assemblyFinishedRef = useRef(false);

  useEffect(() => {
    let sceneTimer: number | undefined;

    fetch("/busan.json")
      .then((response) => response.json())
      .then((data: { features: BusanFeature[] }) => {
        const raw = data.features.map((feature) => ({
          name: feature.properties.name,
          code: feature.properties.code,
          polygons:
            feature.geometry.type === "MultiPolygon"
              ? feature.geometry.coordinates
              : [feature.geometry.coordinates],
        }));
        const nextBbox = getBBox(raw);
        const nextDistricts: District[] = raw.map((district) => ({
          ...district,
          centroid: calcCentroid(district.polygons, nextBbox),
        }));

        setDistricts(nextDistricts);
        setBbox(getBBox(nextDistricts));
        sceneTimer = window.setTimeout(() => setSceneReady(true), 100);
      });

    return () => {
      if (sceneTimer) window.clearTimeout(sceneTimer);
    };
  }, []);

  const handleAssemblyComplete = useCallback(() => {
    if (assemblyFinishedRef.current) return;
    assemblyFinishedRef.current = true;
    setPhase("ready");
  }, []);

  useEffect(
    () => () => {
      loginCleanupRef.current?.();
    },
    [],
  );

  const handleLogin = async () => {
    if (loginPending) return;

    setLoginError("");
    const width = 500;
    const height = 600;
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
      "",
      "GoogleLogin",
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      setLoginError("팝업이 차단됐어요. 팝업을 허용한 뒤 다시 시도해 주세요.");
      return;
    }

    setLoginPending(true);
    const closeWatcher: { id?: number } = {};

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (closeWatcher.id) window.clearInterval(closeWatcher.id);
      loginCleanupRef.current = null;
    };

    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data !== "auth-success") return;

      cleanup();
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      if (!session?.accessToken) {
        setLoginPending(false);
        setLoginError("로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setPhase("entering");
      window.setTimeout(() => setOverlayOpacity(1), 1400);
    };

    window.addEventListener("message", onMessage);
    loginCleanupRef.current = cleanup;
    closeWatcher.id = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      setLoginPending(false);
    }, 500);

    try {
      const form = popup.document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/signin/google";
      const csrfResponse = await fetch("/api/auth/csrf");
      if (!csrfResponse.ok) throw new Error("CSRF request failed");
      const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
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
    } catch {
      cleanup();
      popup.close();
      setLoginPending(false);
      setLoginError("로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  // 완성된 지도를 정면으로 유지하면서 기존 조립 애니메이션은 그대로 사용한다.
  const scenePhase = "assembling";
  const panelVisible = phase === "ready";

  return (
    <main className={styles.viewport}>
      <Image
        src="/login-watercolor-bg.png"
        alt=""
        fill
        priority
        sizes="(max-width: 512px) 100vw, 512px"
        className={styles.backgroundArt}
      />
      <div className={styles.backgroundWash} aria-hidden="true" />

      <section className={`${styles.branding} ${phase === "entering" ? styles.brandingLeaving : ""}`}>
        <Image src={nubiLogo} alt="누비" priority className={styles.heroLogo} />
        <h1>부산 여행을 더 가볍게</h1>
        <p>대중교통으로 만나는 나만의 부산 여행</p>
      </section>

      <p className={styles.topLettering} aria-hidden="true">
        오늘도,
        <br />
        부산을 누비다
      </p>

      <section
        className={`${styles.mapStage} ${phase === "entering" ? styles.mapStageEntering : ""}`}
        aria-label="부산 지도가 조립되는 애니메이션"
      >
        <div className={styles.mapGlow} aria-hidden="true" />
        <div className={styles.canvasWrap} style={{ opacity: sceneReady ? 1 : 0 }}>
          {bbox && (
            <Canvas
              dpr={[1, 1.5]}
              shadows
              camera={{ position: [0, 0, 9.8], fov: 52 }}
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={null}>
                <CameraZoomIn active={phase === "entering"} onDone={onEnter} />
                <Scene
                  districts={districts}
                  bbox={bbox}
                  phase={scenePhase}
                  colorPalette={LOGIN_DISTRICT_COLORS}
                  heroStyle
                  showHeroLabels={panelVisible}
                  onAssemblyComplete={handleAssemblyComplete}
                  onSelect={() => {}}
                  selected={null}
                  controlsRef={controlsRef}
                />
              </Suspense>
            </Canvas>
          )}
        </div>

        <svg
          className={`${styles.routeLayer} ${panelVisible ? styles.routeVisible : ""}`}
          viewBox="0 0 360 170"
          aria-hidden="true"
        >
          <path
            className={styles.routeShadow}
            d="M38 126 C82 151 102 96 142 101 C180 106 201 126 232 104 C260 84 280 62 306 42"
          />
          <path
            pathLength="1"
            className={styles.routeRail}
            d="M38 126 C82 151 102 96 142 101 C180 106 201 126 232 104 C260 84 280 62 306 42"
          />
          <path
            pathLength="1"
            className={styles.routePath}
            d="M38 126 C82 151 102 96 142 101 C180 106 201 126 232 104 C260 84 280 62 306 42"
          />

          <g transform="translate(38 126)">
            <g className={styles.routePin}>
              <path d="M0 9c-7-8-10-12-10-18a10 10 0 0 1 20 0C10-3 7 1 0 9Z" />
              <circle cy="-9" r="3.7" />
            </g>
          </g>
          <g transform="translate(306 42)">
            <g className={`${styles.routePin} ${styles.routePinEnd}`}>
              <path d="M0 9c-7-8-10-12-10-18a10 10 0 0 1 20 0C10-3 7 1 0 9Z" />
              <circle cy="-9" r="3.7" />
            </g>
          </g>

          <circle cx="72" cy="132" r="4.5" className={styles.routeStop} style={{ animationDelay: "700ms" }} />
          <circle cx="111" cy="104" r="4.5" className={styles.routeStop} style={{ animationDelay: "760ms" }} />
          <circle cx="151" cy="103" r="4.5" className={styles.routeStop} style={{ animationDelay: "820ms" }} />
          <circle cx="194" cy="113" r="4.5" className={styles.routeStop} style={{ animationDelay: "880ms" }} />
          <circle cx="237" cy="100" r="4.5" className={styles.routeStop} style={{ animationDelay: "940ms" }} />
          <circle cx="273" cy="70" r="4.5" className={styles.routeStop} style={{ animationDelay: "1000ms" }} />

          <g className={styles.busBadge} transform="translate(108 104)">
            <circle r="19" />
            <rect x="-7" y="-9" width="14" height="18" rx="3.5" />
            <path d="M-4.5 -4.5h9M-4.5 1.5h9" />
            <circle cx="-4.5" cy="11" r="1.8" />
            <circle cx="4.5" cy="11" r="1.8" />
          </g>
        </svg>
      </section>

      <section
        className={`${styles.loginSheet} ${panelVisible ? styles.sheetVisible : ""} ${phase === "entering" ? styles.sheetLeaving : ""}`}
        aria-hidden={!panelVisible && phase !== "entering"}
      >
        <Image src={nubiLogo} alt="누비" className={styles.sheetLogo} />
        <h2>
          부산 곳곳을 누비는
          <br />
          여행을 시작해 보세요
        </h2>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loginPending || !panelVisible}
          className={styles.googleButton}
        >
          <GoogleIcon />
          <span>{loginPending ? "Google 로그인 중..." : "Google로 시작하기"}</span>
          <ChevronRight aria-hidden="true" className={styles.buttonArrow} />
        </button>

        <div className={styles.divider} />
        <p className={styles.terms}>
          로그인하면 <span>서비스 이용약관</span> 및 <span>개인정보 처리방침</span>에
          <br className={styles.termsBreak} /> 동의하게 됩니다.
        </p>
        <p className={styles.errorMessage} aria-live="polite">
          {loginError}
        </p>
      </section>

      <div className={styles.flash} style={{ opacity: overlayOpacity }} aria-hidden="true" />
    </main>
  );
}
