export type Coord = [number, number];
export type Polygon = Coord[][];

export interface District {
  name: string;
  code: string;
  polygons: Polygon[];
  centroid: [number, number];
}

export interface BBox {
  cx: number;
  cy: number;
  scale: number;
}

export function getBBox(districts: Pick<District, "polygons">[]): BBox {
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

export function simplify(ring: Coord[], tol = 0.002): Coord[] {
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

export function calcCentroid(polygons: Polygon[], bbox: BBox): [number, number] {
  const largest = polygons.reduce((a, c) => (c[0].length > a[0].length ? c : a));
  const ring = largest[0];
  let sx = 0, sy = 0;
  for (const [lng, lat] of ring) { sx += lng; sy += lat; }
  return [(sx / ring.length - bbox.cx) * bbox.scale, (sy / ring.length - bbox.cy) * bbox.scale];
}
