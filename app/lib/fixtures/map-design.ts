import type {
  FeatureCollection,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";
import type { Severity } from "@/types/dashboard";
import { severityFillColor } from "@/lib/fixtures/regions-geojson";

export type MapDotProperties = {
  /** 0 at epicenter → 1 far inland (drives radial color) */
  impact: number;
};

export type RegionMarkerProperties = {
  id: string;
  name: string;
  severity: Severity | "neutral";
};

export type MapLabelProperties = {
  label: string;
  kind: "city" | "country" | "water";
};

export type MapTheme = "dark" | "light";

export type MapDesignColors = {
  water: string;
  land: string;
  border: string;
  departmentBorder: string;
  neighborFill: string;
  neighborEdge: string;
  labelCity: string;
  labelCountry: string;
  labelWater: string;
  labelHalo: string;
  selectionStroke: string;
  selectionStrokeHover: string;
  severity: typeof severityFillColor;
  impactRamp: readonly [string, string, string, string, string];
};

const darkMapColors: MapDesignColors = {
  water: "#000b1e",
  land: "#061428",
  border: "rgba(200, 230, 245, 0.85)",
  departmentBorder: "rgba(165, 205, 225, 0.45)",
  neighborFill: "#0d2238",
  neighborEdge: "rgba(150, 180, 200, 0.42)",
  labelCity: "#f5f7fa",
  labelCountry: "rgba(160, 185, 205, 0.5)",
  labelWater: "rgba(130, 160, 185, 0.38)",
  labelHalo: "#000b1e",
  selectionStroke: "#f5f7fa",
  selectionStrokeHover: "#e8eef3",
  severity: severityFillColor,
  impactRamp: [
    "#ef3340",
    "#ff681d",
    "#ffb000",
    "#66b032",
    "rgba(175, 205, 220, 0.45)",
  ],
};

/** Soft topographic light map that matches the dashboard light chrome. */
const lightMapColors: MapDesignColors = {
  water: "#c5d4e3",
  land: "#f2f6fa",
  border: "rgba(3, 28, 49, 0.35)",
  departmentBorder: "rgba(3, 28, 49, 0.28)",
  neighborFill: "#a9bdcf",
  neighborEdge: "rgba(3, 28, 49, 0.32)",
  labelCity: "#031c31",
  labelCountry: "rgba(3, 28, 49, 0.48)",
  labelWater: "rgba(45, 80, 110, 0.48)",
  labelHalo: "rgba(242, 246, 250, 0.92)",
  selectionStroke: "#031c31",
  selectionStrokeHover: "#1a3a52",
  severity: severityFillColor,
  impactRamp: [
    "#ef3340",
    "#ff681d",
    "#d99400",
    "#4f9a28",
    "rgba(70, 105, 135, 0.4)",
  ],
};

export function getMapDesignColors(theme: MapTheme): MapDesignColors {
  return theme === "light" ? lightMapColors : darkMapColors;
}

/** @deprecated Prefer getMapDesignColors(theme) */
export const mapDesignColors = darkMapColors;

/** Public URL fixtures — loaded by MapLibre / fetch, not bundled into JS. */
export const mapPublicUrls = {
  departments: "/map/colombia-departments.json",
  neighbors: "/map/neighbors.json",
  impactRegions: "/map/impact-regions.json",
  dots: "/map/colombia-dots.json",
  markers: "/map/region-markers.json",
  labels: "/map/map-labels.json",
  epicenter: "/map/epicenter.json",
} as const;

export const emptyDotCloudGeoJson: FeatureCollection<Point, MapDotProperties> =
  {
    type: "FeatureCollection",
    features: [],
  };

type CompactDots = { points: [number, number, number][] };

let cachedDotCloud: FeatureCollection<Point, MapDotProperties> | null = null;

/** Expand compact `{ points: [lng,lat,impact][] }` into GeoJSON (once). */
export function expandCompactDots(
  compact: CompactDots,
): FeatureCollection<Point, MapDotProperties> {
  if (cachedDotCloud) return cachedDotCloud;
  cachedDotCloud = {
    type: "FeatureCollection",
    features: compact.points.map(([lng, lat, impact]) => ({
      type: "Feature",
      properties: { impact },
      geometry: { type: "Point", coordinates: [lng, lat] },
    })),
  };
  return cachedDotCloud;
}

export async function fetchColombiaDotCloudGeoJson(): Promise<
  FeatureCollection<Point, MapDotProperties>
> {
  if (cachedDotCloud) return cachedDotCloud;
  const res = await fetch(mapPublicUrls.dots);
  if (!res.ok) throw new Error(`Failed to load dots: ${res.status}`);
  const compact = (await res.json()) as CompactDots;
  return expandCompactDots(compact);
}

function ringCentroid(ring: number[][]): [number, number] {
  let lng = 0;
  let lat = 0;
  const n = Math.max(ring.length - 1, 1);
  for (let i = 0; i < n; i++) {
    lng += ring[i][0];
    lat += ring[i][1];
  }
  return [lng / n, lat / n];
}

type LandGeometry = Polygon | MultiPolygon;

export function geometryCentroid(geometry: LandGeometry): [number, number] {
  const rings =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((poly) => poly[0]);
  let best = rings[0];
  let bestArea = -1;
  for (const ring of rings) {
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    area = Math.abs(area);
    if (area > bestArea) {
      bestArea = area;
      best = ring;
    }
  }
  return ringCentroid(best);
}

export type { LandGeometry, MultiPolygon, Polygon };
