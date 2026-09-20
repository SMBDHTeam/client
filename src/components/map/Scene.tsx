"use client";

import React from "react";
import { OrbitControls } from "@react-three/drei";
import { MOUSE } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
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
  colorPalette,
  heroStyle = false,
  onAssemblyComplete,
  onTap,
  tappedName,
}: {
  districts: District[];
  bbox: BBox;
  phase: string;
  onSelect: (code: string, name: string) => void;
  selected: string | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  colorPalette?: readonly string[];
  heroStyle?: boolean;
  onAssemblyComplete?: () => void;
  onTap?: (name: string) => void;
  tappedName?: string | null;
}) {
  return (
    <>
      <ambientLight intensity={heroStyle ? 0.95 : phase === "intro" ? 0.3 : 0.55} />
      <directionalLight
        position={[4, 10, 6]}
        intensity={heroStyle ? 1.25 : 1.5}
        color={heroStyle ? "#f2fbff" : "#fff8f0"}
        castShadow={heroStyle}
      />
      <pointLight
        position={[-6, 4, 4]}
        intensity={heroStyle ? 0.5 : 0.6}
        color={heroStyle ? "#69c9ff" : "#a0c4ff"}
      />
      <pointLight
        position={[6, -2, 2]}
        intensity={heroStyle ? 0.34 : 0.4}
        color={heroStyle ? "#63e6cf" : "#f472b6"}
      />

      <OrbitControls
        ref={controlsRef}
        mouseButtons={{ RIGHT: MOUSE.ROTATE }}
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

      <group
        rotation={
          heroStyle
            ? [-0.14, 0.1, -0.035]
            : phase === "ready"
              ? [-Math.PI / 2, 0, 0]
              : [0, 0, 0]
        }
      >
        {districts.map((d, i) => (
          <DistrictBlock
            key={d.code}
            district={d}
            bbox={bbox}
            color={(colorPalette ?? DISTRICT_COLORS)[i % (colorPalette?.length ?? DISTRICT_COLORS.length)]}
            index={i}
            phase={phase}
            heroStyle={heroStyle}
            onAssemblyComplete={i === districts.length - 1 ? onAssemblyComplete : undefined}
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
