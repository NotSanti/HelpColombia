/**
 * Regenerates lib/fixtures/geo/colombia-dots.json clipped to department
 * polygons (same geometry as the visible Colombia borders), and refreshes
 * colombia-land.json as the MultiPolygon union of those departments.
 *
 * Run from app/: node scripts/generate-colombia-dots.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const geoDir = path.join(root, "lib/fixtures/geo");

const departments = JSON.parse(
  fs.readFileSync(path.join(geoDir, "colombia-departments.json"), "utf8"),
);

const epicenter = [-77.42, 5.92];
const IMPACT_FADE = 6.2;
const step = 0.095;

function pointInRing(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  const polys =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates;
  for (const poly of polys) {
    const [ext, ...holes] = poly;
    if (!pointInRing(point, ext)) continue;
    if (holes.some((h) => pointInRing(point, h))) continue;
    return true;
  }
  return false;
}

function pointInColombia(point) {
  for (const feature of departments.features) {
    if (pointInGeometry(point, feature.geometry)) return true;
  }
  return false;
}

function exteriorsOf(geometry) {
  return geometry.type === "Polygon"
    ? [geometry.coordinates[0]]
    : geometry.coordinates.map((p) => p[0]);
}

/** Build land silhouette from the same department polygons used for borders. */
const landPolygons = [];
let minLng = Infinity;
let minLat = Infinity;
let maxLng = -Infinity;
let maxLat = -Infinity;
const allExteriorRings = [];

for (const feature of departments.features) {
  const geom = feature.geometry;
  if (geom.type === "Polygon") {
    landPolygons.push(geom.coordinates);
    allExteriorRings.push(geom.coordinates[0]);
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      landPolygons.push(poly);
      allExteriorRings.push(poly[0]);
    }
  }
}

for (const ring of allExteriorRings) {
  for (const [lng, lat] of ring) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
}

const colombiaLand = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Colombia", iso: "COL" },
      geometry: {
        type: "MultiPolygon",
        coordinates: landPolygons,
      },
    },
  ],
};
fs.writeFileSync(
  path.join(geoDir, "colombia-land.json"),
  JSON.stringify(colombiaLand),
);

const points = [];
const seen = new Set();
function tryAdd(lng, lat) {
  const x = Math.round(lng * 1e4) / 1e4;
  const y = Math.round(lat * 1e4) / 1e4;
  const key = `${x},${y}`;
  if (seen.has(key)) return;
  if (!pointInColombia([x, y])) return;
  seen.add(key);
  const impact =
    Math.round(
      Math.min(1, Math.hypot(x - epicenter[0], y - epicenter[1]) / IMPACT_FADE) *
        100,
    ) / 100;
  points.push([x, y, impact]);
}

for (let lng = minLng; lng <= maxLng; lng += step) {
  for (let lat = minLat; lat <= maxLat; lat += step) tryAdd(lng, lat);
}

// Only sample along true outer edges (one side land, one side ocean) so
// internal department borders do not inflate the point cloud.
const inset = step * 0.4;
for (const ring of allExteriorRings) {
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const segLen = Math.hypot(x1 - x0, y1 - y0);
    if (segLen < step * 0.25) continue;
    const samples = Math.max(1, Math.ceil(segLen / (step * 0.85)));
    for (let s = 0; s < samples; s++) {
      const t = (s + 0.5) / samples;
      const mx = x0 + (x1 - x0) * t;
      const my = y0 + (y1 - y0) * t;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * inset;
      const ny = (dx / len) * inset;
      const a = [mx + nx, my + ny];
      const b = [mx - nx, my - ny];
      const inA = pointInColombia(a);
      const inB = pointInColombia(b);
      if (inA && !inB) tryAdd(a[0], a[1]);
      if (inB && !inA) tryAdd(b[0], b[1]);
    }
  }
}

const outPath = path.join(geoDir, "colombia-dots.json");
fs.writeFileSync(outPath, JSON.stringify({ points }));
fs.mkdirSync(path.join(root, "public/map"), { recursive: true });
fs.writeFileSync(path.join(root, "public/map/colombia-dots.json"), JSON.stringify({ points }));

console.log(
  `Wrote ${points.length} dots + colombia-land MultiPolygon (${landPolygons.length} parts)`,
);
console.log(`dots bytes`, fs.statSync(outPath).size);
console.log(
  `land bytes`,
  fs.statSync(path.join(geoDir, "colombia-land.json")).size,
);
