"use client";

import React from "react";
import { OrbitControls } from "@react-three/drei";
import { DistrictBlock } from "@/components/map/DistrictBlock";
import { DISTRICT_COLORS } from "@/constants/districts";
import type { District, BBox } from "@/utils/geoUtils";

export function Scene({
  districts,
  bbox,
  phase,
  onSelect,
  selected,
  controlsRef,
  onTap,
  tappedName,
}: {
  districts: District[];
  bbox: BBox;
  phase: string;
  onSelect: (code: string, name: string) => void;
  selected: string | null;
  controlsRef: React.RefObject<any>;
  onTap?: (name: string) => void;
  tappedName?: string | null;
}) {
  return (
    <>
      <ambientLight intensity={phase === "intro" ? 0.3 : 0.55} />
      <directionalLight position={[4, 10, 6]} intensity={1.5} color="#fff8f0" />
      <pointLight position={[-6, 4, 4]} intensity={0.6} color="#a0c4ff" />
      <pointLight position={[6, -2, 2]} intensity={0.4} color="#f472b6" />

      <OrbitControls
        ref={controlsRef}
        mouseButtons={{ RIGHT: 0 } as any}
        rotateSpeed={0.25}
        enablePan={false}
        enableZoom={true}
        zoomSpeed={0.8}
        minDistance={5}
        maxDistance={22}
        enableDamping
        dampingFactor={0.06}
        enabled={phase === "intro"}
      />

      <group rotation={phase === "ready" ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
        {districts.map((d, i) => (
          <DistrictBlock
            key={d.code}
            district={d}
            bbox={bbox}
            color={DISTRICT_COLORS[i % DISTRICT_COLORS.length]}
            index={i}
            phase={phase}
            onSelect={onSelect}
            selected={selected === d.code}
            onTap={onTap}
            tapped={tappedName === d.name}
          />
        ))}
      </group>
    </>
  );
}
