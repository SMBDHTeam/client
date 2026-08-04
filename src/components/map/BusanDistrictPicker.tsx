"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getBBox, simplify, calcCentroid } from "@/lib/geoUtils";
import type { Coord, Polygon, District, BBox } from "@/lib/geoUtils";
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
  return new THREE.ExtrudeGeometry(shapes, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
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
      const targetPos = new THREE.Vector3(cx * 0.6, 4.5 * distance, -cy * 0.6 + 3 * distance);
      const targetLook = new THREE.Vector3(cx * 0.6, 0, -cy * 0.6);
      camera.position.lerp(targetPos, speed);
      const currentLook = new THREE.Vector3();
      camera.getWorldDirection(currentLook);
      const dir = targetLook.clone().sub(camera.position).normalize();
      camera.lookAt(camera.position.clone().add(currentLook.lerp(dir, speed)));
    } else {
      const overviewPos = new THREE.Vector3(0, 9 * distance, 3 * distance);
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
  const zRef = useRef(0);
  const geo = useMemo(() => makeGeo(district.polygons, bbox), [district, bbox]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const target = pressing ? -0.24 : 0;
    zRef.current += (target - zRef.current) * Math.min(1, dt * 14);
    ref.current.position.z = zRef.current;
  });

  return (
    <mesh
      ref={ref}
      geometry={geo}
      onPointerDown={(e) => {
        e.stopPropagation();
        setPressing(true);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        setPressing(false);
        onSelect();
      }}
      onPointerLeave={() => setPressing(false)}
    >
      <meshStandardMaterial
        color={selected ? "#2563eb" : color}
        roughness={0.38}
        metalness={0.1}
        emissive={selected ? "#1e40af" : "#000"}
        emissiveIntensity={selected ? 0.18 : 0}
      />
    </mesh>
  );
}

const LABEL_OFFSETS: Record<string, [number, number]> = {
  "21120": [0, 1.4],
};

function DistrictLabel({
  district,
  onSelect,
}: {
  district: District;
  onSelect: () => void;
}) {
  const [cx, cy] = district.centroid;
  const [dx, dy] = LABEL_OFFSETS[district.code] ?? [0, 0];
  return (
    <Html
      position={[cx + dx, cy + dy, 0.3]}
      center
      distanceFactor={7}
      zIndexRange={[10, 0]}
      occlude={false}
    >
      <span
        onClick={onSelect}
        style={{
          pointerEvents: "auto",
          cursor: "pointer",
          whiteSpace: "nowrap",
          borderRadius: 999,
          padding: "2px 7px",
          fontSize: 11,
          fontWeight: 700,
          color: "#0f172a",
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}
      >
        {district.name}
      </span>
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
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 10, 6]} intensity={1.5} color="#fff8f0" />
      <pointLight position={[-6, 4, 4]} intensity={0.5} color="#a0c4ff" />
      <CameraController target={camTarget} distance={distance} />
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
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
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
    <div className={className} onWheel={handleWheel} style={{ touchAction: "none" }}>
      {bbox && (
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 9, 3], fov: 50 }} gl={{ antialias: true, alpha: true }}>
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
