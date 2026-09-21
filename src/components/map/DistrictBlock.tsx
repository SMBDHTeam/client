"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html, useCursor } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { simplify } from "@/utils/geoUtils";
import type { Polygon, District, BBox } from "@/utils/geoUtils";
import { LANDMARK_MAP, TEXTURE_MAP } from "@/constants/districts";

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const HERO_LABEL_OFFSETS: Record<string, [number, number]> = {
  "21010": [0.05, -0.12],
  "21020": [-0.16, -0.08],
  "21030": [0.08, 0.12],
  "21040": [0.18, -0.05],
  "21050": [0.12, 0.08],
  "21060": [0.02, 0.12],
  "21070": [0.16, -0.06],
  "21080": [-0.12, 0.08],
  "21090": [0.08, 0.04],
  "21100": [-0.04, -0.12],
  "21120": [1.45, 1.6],
  "21130": [0.12, -0.04],
  "21140": [0.2, -0.06],
  "21150": [-0.12, 0.02],
};

function makeGeo(polygons: Polygon[], bbox: BBox, heroStyle: boolean): THREE.ExtrudeGeometry {
  const shapes = polygons.map((poly) => {
    const shape = new THREE.Shape(
      simplify(poly[0]).map(
        ([lng, lat]) =>
          new THREE.Vector2(
            (lng - bbox.cx) * bbox.scale,
            (lat - bbox.cy) * bbox.scale,
          ),
      ),
    );
    for (let h = 1; h < poly.length; h++) {
      const pts = simplify(poly[h]);
      if (pts.length < 3) continue;
      shape.holes.push(
        new THREE.Path(
          pts.map(
            ([lng, lat]) =>
              new THREE.Vector2(
                (lng - bbox.cx) * bbox.scale,
                (lat - bbox.cy) * bbox.scale,
              ),
          ),
        ),
      );
    }
    return shape;
  });
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: heroStyle ? 0.78 : 0.35,
    bevelEnabled: true,
    bevelThickness: heroStyle ? 0.07 : 0.03,
    bevelSize: heroStyle ? 0.052 : 0.03,
    bevelSegments: 1,
  });

  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const w = box.max.x - box.min.x;
  const h = box.max.y - box.min.y;
  const uvAttr = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setXY(
      i,
      (pos.getX(i) - box.min.x) / w,
      (pos.getY(i) - box.min.y) / h,
    );
  }
  uvAttr.needsUpdate = true;
  return geo;
}

export function DistrictBlock({
  district,
  bbox,
  color,
  index,
  phase,
  heroStyle = false,
  showHeroLabel = false,
  onAssemblyComplete,
  onSelect,
  selected,
  onTap,
  tapped,
}: {
  district: District;
  bbox: BBox;
  color: string;
  index: number;
  phase: string;
  heroStyle?: boolean;
  showHeroLabel?: boolean;
  onAssemblyComplete?: () => void;
  onSelect: (code: string, name: string) => void;
  selected: boolean;
  onTap?: (name: string) => void;
  tapped?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const texture = useMemo(() => {
    const src = TEXTURE_MAP[district.name];
    return src ? new THREE.TextureLoader().load(src) : null;
  }, [district.name]);
  const floatSeed = seededUnit(index + 1) * Math.PI * 2;
  const scatterPos = useMemo(
    () =>
      new THREE.Vector3(
        (seededUnit(index + 11) - 0.5) * (heroStyle ? 13 : 16),
        (seededUnit(index + 23) - 0.5) * (heroStyle ? 8 : 10),
        (seededUnit(index + 37) - 0.5) * (heroStyle ? 12 : 8),
      ),
    [heroStyle, index],
  );
  const currentPos = useRef(scatterPos.clone());
  const geo = useMemo(
    () => makeGeo(district.polygons, bbox, heroStyle),
    [bbox, district.polygons, heroStyle],
  );
  const heroSideColor = useMemo(
    () => new THREE.Color(selected ? "#1d4ed8" : color).multiplyScalar(0.48),
    [color, selected],
  );
  const labelAnchor = useMemo(() => {
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    return { x: (box.min.x + box.max.x) / 2, y: box.max.y + 0.35 };
  }, [geo]);
  const [pressing, setPressing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const pressZ = useRef(0);
  const hoverLift = useRef(0);
  const scaleRef = useRef(1);
  const isDragging = useRef(false);
  const dragMoved = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const dragOffset = useRef(new THREE.Vector3());
  const heroFaceColor = useMemo(() => {
    const nextColor = new THREE.Color(selected ? "#3b82f6" : color);
    return hovered ? nextColor.lerp(new THREE.Color("#8be6ff"), 0.24) : nextColor;
  }, [color, hovered, selected]);
  const [heroLabelDx, heroLabelDy] = HERO_LABEL_OFFSETS[district.code] ?? [0, 0];

  useCursor(heroStyle && hovered);

  useEffect(() => {
    if (phase === "assembling" && ref.current) {
      if (heroStyle) {
        ref.current.rotation.set(
          (seededUnit(index + 41) - 0.5) * 1.1,
          (seededUnit(index + 53) - 0.5) * 1.5,
          (seededUnit(index + 67) - 0.5) * 0.8,
        );
        scaleRef.current = 0.62;
        ref.current.scale.setScalar(scaleRef.current);
      }

      const timeline = gsap.timeline({
        delay: index * (heroStyle ? 0.045 : 0.03),
        onComplete: onAssemblyComplete,
      });
      timeline.to(currentPos.current, {
        x: 0,
        y: 0,
        z: heroStyle ? 0.34 : 0,
        duration: (heroStyle ? 1.08 : 1.2) + index * 0.04,
        ease: heroStyle ? "power3.out" : "power3.inOut",
      });
      if (heroStyle) {
        timeline.to(currentPos.current, {
          z: 0,
          duration: 0.3,
          ease: "back.out(2.1)",
        });
      }

      return () => {
        timeline.kill();
      };
    }
  }, [heroStyle, index, onAssemblyComplete, phase]);

  useFrame(({ clock }, dt) => {
    if (!ref.current) return;

    if (phase === "intro") {
      if (!isDragging.current) {
        ref.current.position.copy(currentPos.current);
        ref.current.position.y += Math.sin(clock.elapsedTime * 0.7 + floatSeed) * 0.15;
        ref.current.rotation.y += dt * 0.12;
        ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.4 + floatSeed) * 0.1;
      }
      const targetScale = pressing ? 1.18 : 1;
      scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, dt * 14);
      ref.current.scale.setScalar(scaleRef.current);
    } else if (phase === "assembling") {
      ref.current.position.copy(currentPos.current);
      const targetLift = heroStyle && hovered ? 0.3 : 0;
      hoverLift.current += (targetLift - hoverLift.current) * Math.min(1, dt * 12);
      ref.current.position.z += hoverLift.current;
      ref.current.rotation.y *= 0.92;
      ref.current.rotation.x *= 0.92;
      const targetScale = heroStyle && hovered ? 1.055 : 1;
      scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, dt * 10);
      ref.current.scale.setScalar(scaleRef.current);
    } else {
      const target = pressing ? -0.22 : 0;
      pressZ.current += (target - pressZ.current) * Math.min(1, dt * 14);
      ref.current.position.z = pressZ.current;
    }
  });

  return (
    <group
      ref={ref}
      rotation={phase === "ready" || phase === "done" ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
    >
      <mesh
        geometry={geo}
        castShadow={heroStyle}
        receiveShadow={heroStyle}
        onPointerEnter={(e) => {
          if (!heroStyle) return;
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerLeave={() => {
          setHovered(false);
          if (!isDragging.current) setPressing(false);
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setPressing(true);
          dragMoved.current = false;
          if (phase === "intro") {
            isDragging.current = true;
            dragPlane.current.setFromNormalAndCoplanarPoint(
              e.camera.getWorldDirection(new THREE.Vector3()).negate(),
              ref.current!.position,
            );
            const hit = new THREE.Vector3();
            e.ray.intersectPlane(dragPlane.current, hit);
            dragOffset.current.copy(currentPos.current).sub(hit);
          }
        }}
        onPointerMove={(e) => {
          if (!isDragging.current || phase !== "intro") return;
          dragMoved.current = true;
          const hit = new THREE.Vector3();
          e.ray.intersectPlane(dragPlane.current, hit);
          currentPos.current.copy(hit.add(dragOffset.current));
          ref.current!.position.copy(currentPos.current);
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          isDragging.current = false;
          setPressing(false);
          if (phase === "ready" && !dragMoved.current) onSelect(district.code, district.name);
          if (phase === "intro" && !dragMoved.current) onTap?.(district.name);
        }}
      >
        {texture ? (
          <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
        ) : (
          heroStyle ? (
            <>
              <meshBasicMaterial
                attach="material-0"
                color={heroFaceColor}
              />
              <meshStandardMaterial
                attach="material-1"
                color={heroSideColor}
                roughness={0.48}
                metalness={0.08}
              />
            </>
          ) : (
            <meshStandardMaterial
              color={selected ? "#2563eb" : color}
              roughness={0.35}
              metalness={0.12}
              emissive={selected ? "#1e40af" : color}
              emissiveIntensity={phase === "intro" ? 0.3 : selected ? 0.18 : 0.05}
            />
          )
        )}
        {heroStyle && <Edges threshold={20} color={hovered ? "#b8f4ff" : "#ffffff"} />}
      </mesh>

      {tapped && (
        <Html position={[labelAnchor.x, labelAnchor.y, 0.4]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)",
            borderRadius: 14, padding: "6px 14px", boxShadow: "0 2px 14px rgba(0,0,0,0.18)",
            whiteSpace: "nowrap", animation: "fadeIn 0.25s ease",
          }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>{district.name}</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", margin: 0 }}>
              {LANDMARK_MAP[district.name] ?? "대표 명소 준비 중"}
            </p>
          </div>
        </Html>
      )}

      {heroStyle && (
        <Html
          position={[
            district.centroid[0] + heroLabelDx,
            district.centroid[1] + heroLabelDy,
            0.98,
          ]}
          center
          distanceFactor={8.2}
          zIndexRange={[8, 0]}
          occlude={false}
          style={{
            pointerEvents: "none",
            opacity: showHeroLabel ? 1 : 0,
            transition: `opacity 280ms ease ${index * 28}ms`,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "block",
              padding: "1px 3px",
              color: "#f8fdff",
              fontSize: "10px",
              fontWeight: 850,
              lineHeight: 1.1,
              letterSpacing: "-0.05em",
              whiteSpace: "nowrap",
              textShadow: "0 1px 2px rgba(5, 39, 77, 0.95), 0 0 5px rgba(9, 64, 113, 0.7)",
              transform: showHeroLabel ? "translateY(0)" : "translateY(4px)",
              transition: `transform 360ms ease ${index * 28}ms`,
              userSelect: "none",
            }}
          >
            {district.name}
          </span>
        </Html>
      )}
    </group>
  );
}
