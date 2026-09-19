"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getBBox, simplify, calcCentroid } from "@/utils/geoUtils";
import type { Polygon, District, BBox } from "@/utils/geoUtils";
import { CENTERS, DISTRICT_COLORS } from "@/constants/districts";

export type DistrictSelection = { code: string; name: string; lat: number; lng: number };

function makeGeo(polygons: Polygon[], bbox: BBox): THREE.ExtrudeGeometry {
  const shapes = polygons.map((poly) => {
    const shape = new THREE.Shape(
      simplify(poly[0]).map(([lng, lat]) => new THREE.Vector2((lng - bbox.cx) * bbox.scale, (lat - bbox.cy) * bbox.scale)),
    );
    for (let h = 1; h < poly.length; h++) {
      const pts = simplify(poly[h]);
      if (pts.length < 3) continue;
      shape.holes.push(
        new THREE.Path(pts.map(([lng, lat]) => new THREE.Vector2((lng - bbox.cx) * bbox.scale, (lat - bbox.cy) * bbox.scale))),
      );
    }
    return shape;
  });
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: 0.42,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.028,
    bevelSegments: 2,
  });
  geometry.computeVertexNormals();
  return geometry;
}

function CameraController({
  target,
  distance,
}: {
  target: [number, number] | null;
  distance: number;
}) {
  const { camera } = useThree();

  useFrame((_, dt) => {
    const speed = Math.min(1, dt * 4);
    if (target) {
      const [cx, cy] = target;
      const targetPos = new THREE.Vector3(cx * 0.6, 4.8 * distance, -cy * 0.6 + 4 * distance);
      const targetLook = new THREE.Vector3(cx * 0.6, 0, -cy * 0.6);
      camera.position.lerp(targetPos, speed);
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      const dir = targetLook.clone().sub(camera.position).normalize();
      camera.lookAt(camera.position.clone().add(currentLook.lerp(dir, speed)));
    } else {
      const overviewPos = new THREE.Vector3(0, 8.2 * distance, 4.2 * distance);
      const overviewLook = new THREE.Vector3(0, 0, 0);
      camera.position.lerp(overviewPos, speed);
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      const dir = overviewLook.clone().sub(camera.position).normalize();
      camera.lookAt(camera.position.clone().add(currentLook.lerp(dir, speed)));
    }
  });

  return null;
}

function DistrictBlock({
  district,
  bbox,
  color,
  selected,
  onSelect,
}: {
  district: District;
  bbox: BBox;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [pressing, setPressing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const zRef = useRef(0);
  const geo = useMemo(() => makeGeo(district.polygons, bbox), [district, bbox]);
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 28), [geo]);
  const surfaceColor = useMemo(() => {
    const base = new THREE.Color(selected ? "#2E7DF2" : color);
    if (hovering && !selected) base.lerp(new THREE.Color("#dff8ff"), 0.2);
    return base;
  }, [color, hovering, selected]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const restingHeight = selected ? 0.48 : hovering ? 0.2 : 0;
    const target = pressing ? Math.max(0.06, restingHeight - 0.1) : restingHeight;
    zRef.current += (target - zRef.current) * Math.min(1, dt * 12);
    ref.current.position.z = zRef.current;
  });

  return (
    <mesh
      ref={ref}
      geometry={geo}
      castShadow
      receiveShadow
      renderOrder={selected ? 2 : 1}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovering(true);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        setPressing(true);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        setPressing(false);
        onSelect();
      }}
      onPointerLeave={() => {
        setHovering(false);
        setPressing(false);
      }}
    >
      <meshStandardMaterial
        color={surfaceColor}
        roughness={0.46}
        metalness={0.04}
        emissive={selected ? "#164cb7" : hovering ? color : "#000000"}
        emissiveIntensity={selected ? 0.22 : hovering ? 0.08 : 0}
      />
      <lineSegments geometry={edges} renderOrder={3}>
        <lineBasicMaterial
          color={selected ? "#ffffff" : "#e9fbff"}
          transparent
          opacity={selected ? 0.98 : hovering ? 0.9 : 0.66}
          depthWrite={false}
        />
      </lineSegments>
    </mesh>
  );
}

const LABEL_OFFSETS: Record<string, [number, number]> = {
  "21120": [0, 1.4],
};

function DistrictLabel({
  district,
  selected,
  onSelect,
}: {
  district: District;
  selected: boolean;
  onSelect: () => void;
}) {
  const [cx, cy] = district.centroid;
  const [dx, dy] = LABEL_OFFSETS[district.code] ?? [0, 0];
  return (
    <Html
      position={[cx + dx, cy + dy, selected ? 0.96 : 0.5]}
      center
      distanceFactor={7}
      zIndexRange={[10, 0]}
      occlude={false}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${district.name} 선택`}
        style={{
          pointerEvents: "auto",
          cursor: "pointer",
          whiteSpace: "nowrap",
          borderRadius: 999,
          border: selected ? "1px solid rgba(255,255,255,0.9)" : "1px solid rgba(191,219,254,0.9)",
          padding: selected ? "3px 8px" : "2px 7px",
          fontSize: 11,
          fontWeight: 700,
          color: selected ? "#ffffff" : "#17345e",
          background: selected ? "rgba(46,125,242,0.96)" : "rgba(255,255,255,0.9)",
          boxShadow: selected
            ? "0 5px 14px rgba(46,125,242,0.34)"
            : "0 2px 7px rgba(36,84,125,0.18)",
          transition: "background 160ms ease, color 160ms ease, box-shadow 160ms ease",
        }}
      >
        {district.name}
      </button>
    </Html>
  );
}

function Scene({
  districts,
  bbox,
  selected,
  onSelect,
  distance,
}: {
  districts: District[];
  bbox: BBox;
  selected: string | null;
  onSelect: (code: string) => void;
  distance: number;
}) {
  const selectedDistrict = districts.find((d) => d.code === selected);
  const camTarget = selectedDistrict ? selectedDistrict.centroid : null;

  return (
    <>
      <ambientLight intensity={0.72} />
      <hemisphereLight args={["#e9f8ff", "#72aaa5", 1.05]} />
      <directionalLight
        castShadow
        position={[4, 11, 7]}
        intensity={1.75}
        color="#fffdf8"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />
      <pointLight position={[-5, 5, 4]} intensity={0.48} color="#8edbf7" />
      <CameraController target={camTarget} distance={distance} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]} receiveShadow>
        <circleGeometry args={[6.4, 64]} />
        <shadowMaterial color="#2d6c87" transparent opacity={0.13} />
      </mesh>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {districts.map((d, i) => (
          <DistrictBlock
            key={d.code}
            district={d}
            bbox={bbox}
            color={DISTRICT_COLORS[i % DISTRICT_COLORS.length]}
            selected={selected === d.code}
            onSelect={() => onSelect(d.code)}
          />
        ))}
        {districts.map((d) => (
          <DistrictLabel
            key={`label-${d.code}`}
            district={d}
            selected={selected === d.code}
            onSelect={() => onSelect(d.code)}
          />
        ))}
      </group>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enabled={!selected}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 4}
      />
    </>
  );
}

export default function BusanDistrictPicker({
  selected,
  onSelect,
  className,
}: {
  selected: string | null;
  onSelect: (selection: DistrictSelection) => void;
  className?: string;
}) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [distance, setDistance] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetch("/busan.json")
      .then((r) => r.json())
      .then((data: { features: { properties: { name: string; code: string }; geometry: { type: string; coordinates: unknown } }[] }) => {
        if (cancelled) return;
        const raw = data.features.map((f) => ({
          name: f.properties.name,
          code: f.properties.code,
          polygons: (f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates]) as Polygon[],
          centroid: [0, 0] as [number, number],
        }));
        const box = getBBox(raw);
        const ds: District[] = raw.map((d) => ({ ...d, centroid: calcCentroid(d.polygons, box) }));
        setDistricts(ds);
        setBbox(box);
      });
    return () => { cancelled = true; };
  }, []);

  function handleSelect(code: string) {
    const d = districts.find((d) => d.code === code);
    const center = CENTERS[code];
    if (!d || !center) return;
    onSelect({ code, name: d.name, lat: center.lat, lng: center.lng });
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    setDistance((d) => Math.min(1.6, Math.max(0.55, d + e.deltaY * 0.0015)));
  }

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      onWheel={handleWheel}
      style={{
        touchAction: "none",
        background:
          "radial-gradient(circle at 50% 36%, rgba(255,255,255,0.98) 0%, rgba(230,247,255,0.96) 48%, rgba(207,239,246,0.98) 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-1/2 h-48 w-[115%] -translate-x-1/2 rounded-[50%] border border-white/75 bg-white/20 shadow-[0_-18px_55px_rgba(74,172,196,0.12)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[48%] h-36 w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-sky-200/45"
      />
      {bbox && (
        <Canvas
          className="relative z-10"
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 8.2, 4.2], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene
              districts={districts}
              bbox={bbox}
              selected={selected}
              onSelect={handleSelect}
              distance={distance}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
