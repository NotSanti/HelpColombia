import type {
  FeatureCollection,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";
import type { Severity } from "@/types/dashboard";

export type RegionFeatureProperties = {
  id: string;
  name: string;
  severity: Severity;
  deaths: string;
  affected: string;
};

export type LandGeometry = Polygon | MultiPolygon;

/** Camera framing for the Colombia impact map. */
export const colombiaMapView = {
  center: [-74.5, 4.2] as [number, number],
  zoom: 5.6,
  minZoom: 3.5,
  maxZoom: 8.5,
  /**
   * Must be wide enough that MapLibre can honor `zoom` / `minZoom`.
   * Tight bounds raise the effective min zoom to ~5–6 on desktop and
   * make lower zoom values look like they do nothing.
   */
  maxBounds: [
    [-105, -18],
    [-50, 30],
  ] as [[number, number], [number, number]],
};

export const severityFillColor: Record<Severity, string> = {
  severe: "#ef3340",
  high: "#ff681d",
  moderate: "#ffb000",
  low: "#66b032",
};

export function polygonExteriorRings(
  geometry: LandGeometry,
): [number, number][][] {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates[0] as [number, number][]];
  }
  return geometry.coordinates.map((poly) => poly[0] as [number, number][]);
}

export type { FeatureCollection, MultiPolygon, Point, Polygon };
