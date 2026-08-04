"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { simplify } from "@/utils/geoUtils";
import type { Polygon, District, BBox } from "@/utils/geoUtils";
import { LANDMARK_MAP, TEXTURE_MAP } from "@/constants/districts";

function makeGeo(polygons: Polygon[], bbox: BBox): THREE.ExtrudeGeometry {
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
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
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
  const floatSeed = useMemo(() => Math.random() * Math.PI * 2, []);
  const scatterPos = useMemo(
    () =>
      new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
      ),
    [],
  );
  const currentPos = useRef(scatterPos.clone());
  const geo = useMemo(() => makeGeo(district.polygons, bbox), [district, bbox]);
  const labelAnchor = useMemo(() => {
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    return { x: (box.min.x + box.max.x) / 2, y: box.max.y + 0.35 };
  }, [geo]);
  const [pressing, setPressing] = useState(false);
  const pressZ = useRef(0);
  const scaleRef = useRef(1);
  const isDragging = useRef(false);
  const dragMoved = useRef(false);
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const dragOffset = useRef(new THREE.Vector3());

  useEffect(() => {
    if (phase === "assembling" && ref.current) {
      gsap.to(currentPos.current, {
        x: 0, y: 0, z: 0,
        duration: 1.2 + index * 0.04,
        ease: "power3.inOut",
        delay: index * 0.03,
      });
    }
  }, [phase]);

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
      ref.current.rotation.y *= 0.92;
      ref.current.rotation.x *= 0.92;
      scaleRef.current += (1 - scaleRef.current) * Math.min(1, dt * 8);
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
        onPointerLeave={() => { if (!isDragging.current) setPressing(false); }}
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
          <meshStandardMaterial
            color={selected ? "#2563eb" : color}
            roughness={0.35}
            metalness={0.12}
            emissive={selected ? "#1e40af" : color}
            emissiveIntensity={phase === "intro" ? 0.3 : selected ? 0.18 : 0.05}
          />
        )}
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
    </group>
  );
}
