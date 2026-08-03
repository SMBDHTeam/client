'use client';

import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import nubiWordmark from '@/assets/icons/nubi_wordmark_stacked_color.png';

type Coord = [number, number];
type Polygon = Coord[][];

interface District {
  name: string;
  code: string;
  polygons: Polygon[];
  centroid: [number, number];
}

interface BBox { cx: number; cy: number; scale: number; }

function getBBox(districts: Omit<District, 'centroid'>[]): BBox {
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
  const shapes = polygons.map(poly => {
    const shape = new THREE.Shape(
      simplify(poly[0]).map(([lng, lat]) => new THREE.Vector2((lng - bbox.cx) * bbox.scale, (lat - bbox.cy) * bbox.scale))
    );
    for (let h = 1; h < poly.length; h++) {
      const pts = simplify(poly[h]);
      if (pts.length < 3) continue;
      shape.holes.push(new THREE.Path(pts.map(([lng, lat]) => new THREE.Vector2((lng - bbox.cx) * bbox.scale, (lat - bbox.cy) * bbox.scale))));
    }
    return shape;
  });
  const geo = new THREE.ExtrudeGeometry(shapes, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });

  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const w = box.max.x - box.min.x;
  const h = box.max.y - box.min.y;
  const uvAttr = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setXY(i, (pos.getX(i) - box.min.x) / w, (pos.getY(i) - box.min.y) / h);
  }
  uvAttr.needsUpdate = true;
  return geo;
}

function calcCentroid(polygons: Polygon[], bbox: BBox): [number, number] {
  const largest = polygons.reduce((a, c) => c[0].length > a[0].length ? c : a);
  const ring = largest[0];
  let sx = 0, sy = 0;
  for (const [lng, lat] of ring) { sx += lng; sy += lat; }
  return [(sx / ring.length - bbox.cx) * bbox.scale, (sy / ring.length - bbox.cy) * bbox.scale];
}

type PaletteMode =
  | { type: 'list'; colors: string[] }
  | { type: 'gradient'; stops: string[] }
  | { type: 'crystal'; base: string; accent: string }
  | { type: 'huewave' }
  | { type: 'gold' }
  | { type: 'neon'; colors: string[] };

const PALETTES: { name: string; mode: PaletteMode; bg?: string }[] = [
  {
    name: '비비드',
    mode: { type: 'list', colors: ['#60a5fa','#34d399','#fbbf24','#f472b6','#a78bfa','#38bdf8','#fb923c','#4ade80','#e879f9','#facc15','#2dd4bf','#818cf8','#f87171','#a3e635','#fb7185','#c084fc'] },
  },
  {
    name: '그라데이션',
    mode: { type: 'gradient', stops: ['#60a5fa', '#818cf8', '#c084fc', '#f472b6'] },
  },
  {
    name: '크리스탈',
    mode: { type: 'crystal', base: '#a5f3fc', accent: '#818cf8' },
  },
  {
    name: 'Hue Wave',
    mode: { type: 'huewave' },
  },
  {
    name: '골드',
    mode: { type: 'gold' },
    bg: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e3a8a 100%)',
  },
  {
    name: '네온',
    mode: { type: 'neon', colors: ['#f0abfc','#67e8f9','#86efac','#fde68a','#f9a8d4','#a5b4fc','#6ee7b7','#fca5a5'] },
    bg: 'linear-gradient(160deg, #030712 0%, #0f0f1a 50%, #0c0a1e 100%)',
  },
];

const LANDMARK_MAP: Record<string, string> = {
  '중구': '용두산공원 · 부산타워',
  '서구': '송도 구름산책로',
  '동구': '이바구길 168계단',
  '영도구': '태종대',
  '부산진구': '서면',
  '동래구': '동래읍성',
  '남구': '오륙도',
  '북구': '화명 생태공원',
  '해운대구': '해운대 해수욕장',
  '사하구': '감천문화마을',
  '금정구': '범어사',
  '강서구': '을숙도',
  '연제구': '부산시청',
  '수영구': '광안대교',
  '사상구': '삼락생태공원',
  '기장군': '해동용궁사',
};

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#',''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lerpColor(a: string, b: string, t: number) {
  const ca = hexToRgb(a), cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `#${[r,g,bl].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
}
function gradientColor(stops: string[], t: number) {
  const seg = (stops.length - 1) * Math.max(0, Math.min(1, t));
  const i = Math.min(Math.floor(seg), stops.length - 2);
  return lerpColor(stops[i], stops[i + 1], seg - i);
}
function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}`;
}
function getPieceColor(
  mode: PaletteMode, index: number, cx: number, cy: number,
  cxMin: number, cxMax: number, cyMin: number, cyMax: number,
): string {
  if (mode.type === 'list') return mode.colors[index % mode.colors.length];
  if (mode.type === 'gradient') {
    const nx = (cx - cxMin) / (cxMax - cxMin || 1);
    const ny = (cy - cyMin) / (cyMax - cyMin || 1);
    return gradientColor(mode.stops, (nx + ny) / 2);
  }
  if (mode.type === 'neon') return mode.colors[index % mode.colors.length];
  if (mode.type === 'gold') return '#d97706';
  if (mode.type === 'huewave') return hslToHex((index * 22) % 360, 85, 62);
  return mode.base;
}

function DistrictBlock({
  district, bbox, color, paletteMode, index, phase, onSelect, selected, onTap, tapped,
}: {
  district: District; bbox: BBox; color: string; paletteMode: PaletteMode; index: number;
  phase: string; onSelect: (code: string, name: string) => void; selected: boolean;
  onTap?: (name: string) => void; tapped?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const TEXTURE_MAP: Record<string, string> = {
    '해운대구': '/haeundae.jpg',
    '수영구':   '/gwangan.jpg',
    '사하구':   '/gamcheon.jpg',
    '기장군':   '/temple.jpg',
    '북구':     '/park.jpg',
    '사상구':   '/park2.jpg',
  };
  const texture = useMemo(() => {
    const src = TEXTURE_MAP[district.name];
    return src ? new THREE.TextureLoader().load(src) : null;
  }, [district.name]);
  const floatSeed = useMemo(() => Math.random() * Math.PI * 2, []);
  const scatterPos = useMemo(() => new THREE.Vector3(
    (Math.random() - 0.5) * 16,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 8,
  ), []);
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
    if (phase === 'assembling' && ref.current) {
      gsap.to(currentPos.current, {
        x: 0, y: 0, z: 0,
        duration: 1.2 + index * 0.04,
        ease: 'power3.inOut',
        delay: index * 0.03,
      });
    }
  }, [phase]);

  useFrame(({ clock }, dt) => {
    if (!ref.current) return;

    if (paletteMode.type === 'huewave' && matRef.current && !selected) {
      const hue = ((clock.elapsedTime * 40 + index * 22) % 360);
      matRef.current.color.setHSL(hue / 360, 0.85, 0.62);
      matRef.current.emissive.setHSL(hue / 360, 0.85, 0.35);
    }

    if (phase === 'intro') {
      if (!isDragging.current) {
        ref.current.position.copy(currentPos.current);
        ref.current.position.y += Math.sin(clock.elapsedTime * 0.7 + floatSeed) * 0.15;
        ref.current.rotation.y += dt * 0.12;
        ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.4 + floatSeed) * 0.1;
      }
      const targetScale = pressing ? 1.18 : 1;
      scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, dt * 14);
      ref.current.scale.setScalar(scaleRef.current);
    } else if (phase === 'assembling') {
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
    <group ref={ref} rotation={phase === 'ready' || phase === 'done' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <mesh
        geometry={geo}
        onPointerLeave={() => { if (!isDragging.current) setPressing(false); }}
        onPointerDown={e => {
          if (e.button !== 0) return;
          e.stopPropagation();
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setPressing(true);
          dragMoved.current = false;
          if (phase === 'intro') {
            isDragging.current = true;
            dragPlane.current.setFromNormalAndCoplanarPoint(
              e.camera.getWorldDirection(new THREE.Vector3()).negate(),
              ref.current!.position
            );
            const hit = new THREE.Vector3();
            e.ray.intersectPlane(dragPlane.current, hit);
            dragOffset.current.copy(currentPos.current).sub(hit);
          }
        }}
        onPointerMove={e => {
          if (!isDragging.current || phase !== 'intro') return;
          dragMoved.current = true;
          const hit = new THREE.Vector3();
          e.ray.intersectPlane(dragPlane.current, hit);
          currentPos.current.copy(hit.add(dragOffset.current));
          ref.current!.position.copy(currentPos.current);
        }}
        onPointerUp={e => {
          e.stopPropagation();
          isDragging.current = false;
          setPressing(false);
          if (phase === 'ready' && !dragMoved.current) {
            onSelect(district.code, district.name);
          }
          if (phase === 'intro' && !dragMoved.current) {
            onTap?.(district.name);
          }
        }}
      >
        {texture ? (
          <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
        ) : paletteMode.type === 'crystal' ? (
          <meshPhysicalMaterial
            color={selected ? '#2563eb' : color}
            emissive={selected ? '#1e40af' : paletteMode.accent}
            emissiveIntensity={phase === 'intro' ? 0.5 : selected ? 0.3 : 0.15}
            roughness={0.05} metalness={0.1}
            transmission={0.55} thickness={1.2} ior={1.45}
            transparent opacity={0.88}
          />
        ) : paletteMode.type === 'gold' ? (
          <meshStandardMaterial
            color={selected ? '#fbbf24' : '#d97706'}
            emissive={selected ? '#92400e' : '#78350f'}
            emissiveIntensity={phase === 'intro' ? 0.4 : selected ? 0.3 : 0.1}
            roughness={0.08} metalness={0.92}
          />
        ) : paletteMode.type === 'neon' ? (
          <meshStandardMaterial
            ref={matRef}
            color={selected ? '#fff' : '#0f172a'}
            emissive={selected ? '#fff' : color}
            emissiveIntensity={phase === 'intro' ? 1.8 : selected ? 2.5 : 1.2}
            roughness={0.6} metalness={0.0}
          />
        ) : (
          <meshStandardMaterial
            ref={matRef}
            color={selected ? '#2563eb' : color}
            roughness={0.35} metalness={0.12}
            emissive={selected ? '#1e40af' : color}
            emissiveIntensity={phase === 'intro' ? 0.3 : selected ? 0.18 : 0.05}
          />
        )}
      </mesh>

      {tapped && (
        <Html position={[labelAnchor.x, labelAnchor.y, 0.4]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)',
            borderRadius: 14, padding: '6px 14px', boxShadow: '0 2px 14px rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap', animation: 'fadeIn 0.25s ease',
          }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>{district.name}</p>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', margin: 0 }}>
              {LANDMARK_MAP[district.name] ?? '대표 명소 준비 중'}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

function Scene({ districts, bbox, phase, onSelect, selected, controlsRef, paletteIndex, onTap, tappedName }: {
  districts: District[]; bbox: BBox; phase: string;
  onSelect: (code: string, name: string) => void; selected: string | null;
  controlsRef: React.RefObject<any>; paletteIndex: number;
  onTap?: (name: string) => void; tappedName?: string | null;
}) {
  const paletteMode = PALETTES[paletteIndex].mode;
  const cxMin = Math.min(...districts.map(d => d.centroid[0]));
  const cxMax = Math.max(...districts.map(d => d.centroid[0]));
  const cyMin = Math.min(...districts.map(d => d.centroid[1]));
  const cyMax = Math.max(...districts.map(d => d.centroid[1]));

  return (
    <>
      <ambientLight intensity={phase === 'intro' ? 0.3 : 0.55} />
      <directionalLight position={[4, 10, 6]} intensity={1.5} color="#fff8f0" />
      <pointLight position={[-6, 4, 4]} intensity={0.6} color="#a0c4ff" />
      <pointLight position={[6, -2, 2]} intensity={0.4} color="#f472b6" />

      <Sparkles count={50} scale={14} size={2.5} speed={0.12} color="#818cf8" opacity={0.6} />

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
        enabled={phase === 'intro'}
      />

      <group rotation={phase === 'ready' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
        {districts.map((d, i) => (
          <DistrictBlock
            key={d.code}
            district={d}
            bbox={bbox}
            color={getPieceColor(paletteMode, i, d.centroid[0], d.centroid[1], cxMin, cxMax, cyMin, cyMax)}
            paletteMode={paletteMode}
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

export default function IntroScene({ onEnter }: { onEnter: (code: string, name: string) => void }) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [phase, setPhase] = useState<'intro' | 'assembling' | 'ready'>('intro');
  const [selected, setSelected] = useState<string | null>(null);
  const [paletteIndex] = useState(0);
  const [tappedName, setTappedName] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!tappedName) return;
    const t = setTimeout(() => setTappedName(null), 2600);
    return () => clearTimeout(t);
  }, [tappedName]);

  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', preventContextMenu);
    return () => window.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  useEffect(() => {
    fetch('/busan.json').then(r => r.json()).then((data: { features: any[] }) => {
      const raw = data.features.map((f: any) => ({
        name: f.properties.name, code: f.properties.code,
        polygons: f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates],
      }));
      const bbox = getBBox(raw);
      const ds = raw.map(d => ({ ...d, centroid: calcCentroid(d.polygons, bbox) }));
      setDistricts(ds);
      setBbox(getBBox(ds));
    });
  }, []);

  const handleStart = async () => {
    const w = 500, h = 600;
    const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
    const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
    const callbackUrl = encodeURIComponent(`${window.location.origin}/auth-success`);
    const popup = window.open(
      '',
      'GoogleLogin',
      `width=${w},height=${h},left=${left},top=${top}`
    );
    if (popup) {
      const form = popup.document.createElement('form');
      form.method = 'POST';
      form.action = '/api/auth/signin/google';
      const csrfRes = await fetch('/api/auth/csrf');
      const { csrfToken } = await csrfRes.json();
      const addField = (name: string, value: string) => {
        const input = popup.document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      addField('csrfToken', csrfToken);
      addField('callbackUrl', decodeURIComponent(callbackUrl));
      popup.document.body.appendChild(form);
      form.submit();
    }

    const onMessage = (e: MessageEvent) => {
      if (e.data === 'auth-success') {
        window.removeEventListener('message', onMessage);
        setPhase('assembling');
        const lastIndex = Math.max(districts.length - 1, 0);
        const assembleSeconds = 1.2 + lastIndex * 0.04 + lastIndex * 0.03;
        const controls = controlsRef.current;
        if (controls) {
          gsap.to(controls.object.position, { x: 0, y: 0, z: 14, duration: assembleSeconds, ease: 'power2.inOut', onUpdate: () => controls.update() });
          gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: assembleSeconds, ease: 'power2.inOut', onUpdate: () => controls.update() });
        }
        setTimeout(() => onEnter('', ''), assembleSeconds * 1000 + 150);
      }
    };
    window.addEventListener('message', onMessage);
  };

const handleSelect = (code: string, name: string) => {
    if (phase === 'ready') {
      setSelected(code);
      setTimeout(() => onEnter(code, name), 400);
    }
  };

  return (
    <div
      style={{ width: '100%', height: '100dvh', background: PALETTES[paletteIndex].bg ?? 'linear-gradient(160deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%)', position: 'relative', overflow: 'hidden', transition: 'background 0.6s ease' }}
      onContextMenu={e => e.preventDefault()}
    >
      {bbox && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 14], fov: 52 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene
              districts={districts} bbox={bbox}
              phase={phase} onSelect={handleSelect} selected={selected}
              controlsRef={controlsRef} paletteIndex={paletteIndex}
              onTap={setTappedName} tappedName={tappedName}
            />
          </Suspense>
        </Canvas>
      )}

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {phase === 'intro' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, animation: 'fadeIn 1s ease',
          }}>
            <Image
              src={nubiWordmark}
              alt="누비 - 부산 대중교통 여행 플래너"
              width={220}
              height={220}
              priority
            />
            <button
              onClick={handleStart}
              style={{
                pointerEvents: 'all', cursor: 'pointer',
                padding: '14px 28px', borderRadius: 50,
                background: '#fff',
                color: '#1a1a2e', fontWeight: 700, fontSize: 15,
                border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'transform .15s, box-shadow .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google로 시작하기
            </button>
          </div>
        )}

        {phase === 'assembling' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#6366f1', fontWeight: 600, animation: 'pulse 1s ease infinite' }}>
              로그인 중...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
