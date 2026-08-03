"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Coord = [number, number];
type Polygon = Coord[][];

type District = {
  name: string;
  code: string;
  polygons: Polygon[];
  centroid: [number, number];
};

type BBox = { cx: number; cy: number; scale: number };

export type DistrictSelection = { code: string; name: string; lat: number; lng: number };

const CENTERS: Record<string, { lat: number; lng: number }> = {
  "21010": { lat: 35.0979, lng: 129.0328 },
  "21020": { lat: 35.0969, lng: 129.0054 },
  "21030": { lat: 35.1235, lng: 129.044 },
  "21040": { lat: 35.0896, lng: 129.0694 },
  "21050": { lat: 35.1619, lng: 129.0536 },
  "21060": { lat: 35.2056, lng: 129.0836 },
  "21070": { lat: 35.1349, lng: 129.0837 },
  "21080": { lat: 35.2368, lng: 128.9992 },
  "21090": { lat: 35.163, lng: 129.1652 },
  "21100": { lat: 35.0895, lng: 128.9745 },
  "21110": { lat: 35.2458, lng: 129.0924 },
  "21120": { lat: 35.1432, lng: 128.9216 },
  "21130": { lat: 35.1763, lng: 129.0814 },
  "21140": { lat: 35.1555, lng: 129.1136 },
  "21150": { lat: 35.1498, lng: 128.9937 },
  "21310": { lat: 35.2447, lng: 129.2171 },
};

const COLORS = [
  "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#38bdf8", "#fb923c", "#4ade80",
  "#e879f9", "#facc15", "#2dd4bf", "#818cf8", "#f87171", "#a3e635", "#fb7185", "#c084fc",
];

function getBBox(districts: Pick<District, "polygons">[]): BBox {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const d of districts)
    for (const poly of d.polygons)
      for (const ring of poly)
        for (const [lng, lat] of ring) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
  return { cx: (minLng + maxLng) / 2, cy: (minLat + maxLat) / 2, scale: 9 / Math.max(maxLng - minLng, maxLat - minLat) };
}

function simplify(ring: Coord[], tol = 0.002): Coord[] {
  if (ring.length <= 4) return ring;
  const out: Coord[] = [ring[0]];
  for (let i = 1; i < ring.length - 1; i++) {
    const [px, py] = out[out.length - 1];
    const [cx, cy] = ring[i];
    if (Math.abs(cx - px) + Math.abs(cy - py) > tol) out.push(ring[i]);
  }
  out.push(ring[ring.length - 1]);
  return out;
}

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

function calcCentroid(polygons: Polygon[], bbox: BBox): [number, number] {
  const largest = polygons.reduce((a, c) => (c[0].length > a[0].length ? c : a));
  const ring = largest[0];
  let sx = 0, sy = 0;
  for (const [lng, lat] of ring) {
    sx += lng;
    sy += lat;
  }
  return [(sx / ring.length - bbox.cx) * bbox.scale, (sy / ring.length - bbox.cy) * bbox.scale];
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
            color={COLORS[i % COLORS.length]}
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
