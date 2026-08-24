"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import type {
  GeoJSONSource,
  LngLatBounds,
  Map,
  MapLayerMouseEvent,
  Popup,
  StyleSpecification,
} from "maplibre-gl";
import type { RegionImpact } from "@/types/dashboard";
import {
  emptyDotCloudGeoJson,
  fetchColombiaDotCloudGeoJson,
  geometryCentroid,
  getMapDesignColors,
  mapPublicUrls,
  type MapTheme,
} from "@/lib/fixtures/map-design";
import {
  colombiaMapView,
  polygonExteriorRings,
  severityFillColor,
  type LandGeometry,
  type RegionFeatureProperties,
} from "@/lib/fixtures/regions-geojson";
import { MapLoadingOverlay } from "@/components/map/MapLoadingOverlay";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

// CSS stays static; MapLibre JS is dynamically imported in the mount effect.
import "maplibre-gl/dist/maplibre-gl.css";

export type MapController = {
  zoomIn: () => void;
  zoomOut: () => void;
  focusRegion: (regionId: string) => void;
};

type ColombiaMapProps = {
  regions: RegionImpact[];
  selectedRegionId: string | null;
  hoveredRegionId: string | null;
  onSelectRegion: (regionId: string | null) => void;
  onHoverRegion: (regionId: string | null) => void;
  onReady?: (controller: MapController) => void;
  /** Fired once style + dots are painted (for shell-owned loaders). */
  onFullyLoaded?: () => void;
  /** When false, parent owns the loading UI (desktop shell). Default true. */
  showLoadingOverlay?: boolean;
  className?: string;
  interactive?: boolean;
  layout?: "viewport" | "contained";
  /** Live epicenter from disaster_events; falls back to static fixture GeoJSON. */
  epicenter?: {
    longitude: number;
    latitude: number;
    magnitude: number;
  } | null;
};

const DEPARTMENTS_SOURCE = "colombia-departments";
const NEIGHBOR_SOURCE = "neighbor-land";
const DOTS_SOURCE = "colombia-dots";
const MARKERS_SOURCE = "region-markers";
const LABELS_SOURCE = "map-labels";
const SOURCE_ID = "impact-regions";
const EPICENTER_SOURCE = "epicenter";

const HIT_LAYER = "impact-regions-hit";
const OUTLINE_LAYER = "impact-regions-outline";
const BOGOTA_STAR_ICON = "bogota-star-icon";

type ImpactRegionsGeoJson = FeatureCollection<
  LandGeometry,
  RegionFeatureProperties
>;

/** Canvas-drawn star — demotiles fonts do not include ★ glyphs. */
function createStarIconStyleImage(): {
  width: number;
  height: number;
  data: Uint8Array;
} {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: size, height: size, data: new Uint8Array(size * size * 4) };
  }

  const cx = size / 2;
  const cy = size / 2;
  const spikes = 5;
  const outer = size * 0.42;
  const inner = size * 0.17;

  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / spikes;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 11, 30, 0.65)";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const imageData = ctx.getImageData(0, 0, size, size);
  return {
    width: size,
    height: size,
    data: new Uint8Array(imageData.data.buffer),
  };
}

function ensureBogotaStarIcon(map: Map) {
  if (map.hasImage(BOGOTA_STAR_ICON)) return;
  map.addImage(BOGOTA_STAR_ICON, createStarIconStyleImage(), {
    pixelRatio: 2,
  });
}

/**
 * Flat mapDesign look: dotted Colombia, accurate department borders,
 * soft neighbor context — no DEM / contours / hillshade.
 * Heavy GeoJSON is referenced by URL so it stays out of the JS bundle.
 */
function buildMapDesignStyle(theme: MapTheme): StyleSpecification {
  const {
    water,
    land,
    departmentBorder,
    impactRamp,
    neighborFill,
    neighborEdge,
    labelCity,
    labelCountry,
    labelWater,
    labelHalo,
    selectionStroke,
    selectionStrokeHover,
  } = getMapDesignColors(theme);

  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      [DEPARTMENTS_SOURCE]: {
        type: "geojson",
        data: mapPublicUrls.departments,
        // Default buffer (128) avoids geojson-vt tile seams that look like a
        // faint grid while zooming. buffer:0 was a perf tweak that caused them.
      },
      [NEIGHBOR_SOURCE]: {
        type: "geojson",
        data: mapPublicUrls.neighbors,
      },
      [DOTS_SOURCE]: {
        type: "geojson",
        data: emptyDotCloudGeoJson,
        buffer: 0,
      },
      [SOURCE_ID]: {
        type: "geojson",
        data: mapPublicUrls.impactRegions,
        promoteId: "id",
      },
      [EPICENTER_SOURCE]: {
        type: "geojson",
        data: mapPublicUrls.epicenter,
        buffer: 0,
      },
      [MARKERS_SOURCE]: {
        type: "geojson",
        data: mapPublicUrls.markers,
        buffer: 0,
      },
      [LABELS_SOURCE]: {
        type: "geojson",
        data: mapPublicUrls.labels,
        buffer: 0,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": water },
      },
      {
        id: "neighbor-fill",
        type: "fill",
        source: NEIGHBOR_SOURCE,
        paint: {
          "fill-color": neighborFill,
          "fill-opacity": 0.85,
        },
      },
      {
        id: "neighbor-outline",
        type: "line",
        source: NEIGHBOR_SOURCE,
        paint: {
          "line-color": neighborEdge,
          "line-width": 0.8,
          "line-opacity": 0.35,
        },
      },
      {
        id: "colombia-base",
        type: "fill",
        source: DEPARTMENTS_SOURCE,
        paint: {
          "fill-color": land,
          "fill-opacity": 1,
        },
      },
      {
        id: HIT_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": [
            "match",
            ["get", "severity"],
            "severe",
            severityFillColor.severe,
            "high",
            severityFillColor.high,
            "moderate",
            severityFillColor.moderate,
            severityFillColor.low,
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.14,
            ["boolean", ["feature-state", "hover"], false],
            0.1,
            0.02,
          ],
        },
      },
      {
        id: "colombia-dots",
        type: "circle",
        source: DOTS_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.85,
            5.5,
            1.1,
            7,
            1.35,
            8.5,
            1.65,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "impact"],
            0,
            impactRamp[0],
            0.18,
            impactRamp[1],
            0.38,
            impactRamp[2],
            0.58,
            impactRamp[3],
            0.82,
            impactRamp[4],
            1,
            impactRamp[4],
          ],
          "circle-opacity": 0.95,
          "circle-blur": 0,
        },
      },
      {
        id: "department-borders",
        type: "line",
        source: DEPARTMENTS_SOURCE,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": departmentBorder,
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4,
            0.65,
            6,
            0.95,
            8,
            1.25,
          ],
          "line-opacity": 0.95,
        },
      },
      {
        id: OUTLINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            selectionStroke,
            ["boolean", ["feature-state", "hover"], false],
            selectionStrokeHover,
            "transparent",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1.8,
            ["boolean", ["feature-state", "hover"], false],
            1.35,
            0,
          ],
          "line-opacity": 0.95,
        },
      },
      {
        id: "epicenter-glow-outer",
        type: "circle",
        source: EPICENTER_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            48,
            7,
            72,
            9,
            96,
          ],
          "circle-color": severityFillColor.severe,
          "circle-opacity": 0.14,
          "circle-blur": 1,
        },
      },
      {
        id: "epicenter-ring-3",
        type: "circle",
        source: EPICENTER_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            42,
            7,
            64,
            9,
            86,
          ],
          "circle-color": "transparent",
          "circle-stroke-width": 1.4,
          "circle-stroke-color": severityFillColor.severe,
          "circle-stroke-opacity": 0.28,
        },
      },
      {
        id: "epicenter-ring-2",
        type: "circle",
        source: EPICENTER_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            28,
            7,
            42,
            9,
            56,
          ],
          "circle-color": "transparent",
          "circle-stroke-width": 1.7,
          "circle-stroke-color": severityFillColor.severe,
          "circle-stroke-opacity": 0.45,
        },
      },
      {
        id: "epicenter-ring-1",
        type: "circle",
        source: EPICENTER_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            16,
            7,
            24,
            9,
            32,
          ],
          "circle-color": "transparent",
          "circle-stroke-width": 2,
          "circle-stroke-color": severityFillColor.severe,
          "circle-stroke-opacity": 0.65,
        },
      },
      {
        id: "epicenter-glow",
        type: "circle",
        source: EPICENTER_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            14,
            7,
            20,
            9,
            26,
          ],
          "circle-color": severityFillColor.severe,
          "circle-opacity": 0.28,
          "circle-blur": 0.75,
        },
      },
      {
        id: "epicenter-glow-inner",
        type: "circle",
        source: EPICENTER_SOURCE,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            8,
            7,
            11,
            9,
            14,
          ],
          "circle-color": severityFillColor.severe,
          "circle-opacity": 0.35,
          "circle-blur": 0.4,
        },
      },
      {
        id: "epicenter-core",
        type: "circle",
        source: EPICENTER_SOURCE,
        paint: {
          "circle-radius": 3,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-color": severityFillColor.severe,
        },
      },
      {
        id: "region-marker-glow-outer",
        type: "circle",
        source: MARKERS_SOURCE,
        filter: ["!=", ["get", "severity"], "neutral"],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            14,
            7,
            20,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "severe",
            severityFillColor.severe,
            "high",
            severityFillColor.high,
            "moderate",
            severityFillColor.moderate,
            severityFillColor.low,
          ],
          "circle-opacity": 0.28,
          "circle-blur": 0.95,
        },
      },
      {
        id: "region-marker-glow",
        type: "circle",
        source: MARKERS_SOURCE,
        filter: ["!=", ["get", "severity"], "neutral"],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            8,
            7,
            11,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "severe",
            severityFillColor.severe,
            "high",
            severityFillColor.high,
            "moderate",
            severityFillColor.moderate,
            severityFillColor.low,
          ],
          "circle-opacity": 0.4,
          "circle-blur": 0.55,
        },
      },
      {
        id: "region-marker-ring",
        type: "circle",
        source: MARKERS_SOURCE,
        paint: {
          "circle-radius": [
            "match",
            ["get", "severity"],
            "neutral",
            4,
            5.5,
          ],
          "circle-color": "transparent",
          "circle-stroke-width": [
            "match",
            ["get", "severity"],
            "neutral",
            1.5,
            2.25,
          ],
          "circle-stroke-color": [
            "match",
            ["get", "severity"],
            "severe",
            severityFillColor.severe,
            "high",
            severityFillColor.high,
            "moderate",
            severityFillColor.moderate,
            "low",
            severityFillColor.low,
            "rgba(220, 230, 240, 0.7)",
          ],
          "circle-stroke-opacity": 0.95,
        },
      },
      {
        id: "region-marker-color-disk",
        type: "circle",
        source: MARKERS_SOURCE,
        filter: ["!=", ["get", "severity"], "neutral"],
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            4.25,
            7,
            5,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "severe",
            severityFillColor.severe,
            "high",
            severityFillColor.high,
            "moderate",
            severityFillColor.moderate,
            severityFillColor.low,
          ],
          "circle-opacity": 0.85,
        },
      },
      {
        id: "region-marker-core",
        type: "circle",
        source: MARKERS_SOURCE,
        paint: {
          "circle-radius": [
            "match",
            ["get", "severity"],
            "neutral",
            1.75,
            2.1,
          ],
          "circle-color": "#ffffff",
          "circle-opacity": 1,
        },
      },
      {
        id: "region-marker-labels",
        type: "symbol",
        source: MARKERS_SOURCE,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            12,
            7,
            14,
          ],
          "text-offset": [0, 1.35],
          "text-anchor": "top",
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": labelCity,
          "text-opacity": 1,
          "text-halo-color": labelHalo,
          "text-halo-width": 0.75,
          "text-halo-blur": 0,
        },
      },
      {
        id: "map-labels",
        type: "symbol",
        source: LABELS_SOURCE,
        filter: ["!=", ["get", "kind"], "city"],
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-size": [
            "match",
            ["get", "kind"],
            "water",
            11,
            10,
          ],
          "text-anchor": "center",
          "text-letter-spacing": [
            "match",
            ["get", "kind"],
            "country",
            0.12,
            0,
          ],
          "text-allow-overlap": true,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": [
            "match",
            ["get", "kind"],
            "water",
            labelWater,
            labelCountry,
          ],
          "text-halo-color": labelHalo,
          "text-halo-width": 1.2,
        },
      },
    ],
  };
}

/** Live-update paint props when the app theme toggles (no full style rebuild). */
function applyMapThemePaints(map: Map, theme: MapTheme) {
  const colors = getMapDesignColors(theme);
  const setPaint = (layer: string, prop: string, value: unknown) => {
    if (!map.getLayer(layer)) return;
    // Paint prop keys vary by layer type; MapLibre's typed overloads are too narrow here.
    map.setPaintProperty(layer, prop as never, value as never);
  };

  setPaint("background", "background-color", colors.water);
  setPaint("neighbor-fill", "fill-color", colors.neighborFill);
  setPaint("neighbor-outline", "line-color", colors.neighborEdge);
  setPaint("colombia-base", "fill-color", colors.land);
  setPaint("department-borders", "line-color", colors.departmentBorder);
  setPaint("colombia-dots", "circle-color", [
    "interpolate",
    ["linear"],
    ["get", "impact"],
    0,
    colors.impactRamp[0],
    0.18,
    colors.impactRamp[1],
    0.38,
    colors.impactRamp[2],
    0.58,
    colors.impactRamp[3],
    0.82,
    colors.impactRamp[4],
    1,
    colors.impactRamp[4],
  ]);
  setPaint(OUTLINE_LAYER, "line-color", [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    colors.selectionStroke,
    ["boolean", ["feature-state", "hover"], false],
    colors.selectionStrokeHover,
    "transparent",
  ]);
  setPaint("region-marker-labels", "text-color", colors.labelCity);
  setPaint("region-marker-labels", "text-halo-color", colors.labelHalo);
  setPaint("map-labels", "text-color", [
    "match",
    ["get", "kind"],
    "water",
    colors.labelWater,
    colors.labelCountry,
  ]);
  setPaint("map-labels", "text-halo-color", colors.labelHalo);
  setPaint("bogota-label", "text-color", colors.labelCity);
  setPaint("bogota-label", "text-halo-color", colors.labelHalo);
}

function addBogotaLabelLayer(map: Map, theme: MapTheme) {
  ensureBogotaStarIcon(map);
  const { labelCity, labelHalo } = getMapDesignColors(theme);
  if (map.getLayer("bogota-label")) return;
  map.addLayer({
    id: "bogota-label",
    type: "symbol",
    source: LABELS_SOURCE,
    filter: ["==", ["get", "kind"], "city"],
    layout: {
      "icon-image": BOGOTA_STAR_ICON,
      "icon-size": 0.5,
      "icon-anchor": "right",
      "icon-offset": [-2, 0],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "text-field": ["get", "label"],
      "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
      "text-size": 12,
      "text-anchor": "left",
      "text-offset": [0.55, 0],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": labelCity,
      "text-opacity": 1,
      "text-halo-color": labelHalo,
      "text-halo-width": 0.75,
      "text-halo-blur": 0,
      "icon-opacity": 1,
    },
  });
}

function regionIdFromEvent(e: MapLayerMouseEvent): string | null {
  const id = e.features?.[0]?.properties?.id;
  return typeof id === "string" ? id : null;
}

function whenStyleReady(map: Map, callback: () => void) {
  if (map.isStyleLoaded()) {
    callback();
    return;
  }
  map.once("load", callback);
}

function scheduleIdle(callback: () => void, timeout = 1200): number {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(callback, 0);
}

function cancelIdle(handle: number) {
  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle);
  } else {
    window.clearTimeout(handle);
  }
}

export function ColombiaMap({
  regions,
  selectedRegionId,
  hoveredRegionId,
  onSelectRegion,
  onHoverRegion,
  onReady,
  onFullyLoaded,
  showLoadingOverlay = true,
  className,
  interactive = true,
  layout = "viewport",
  epicenter = null,
}: ColombiaMapProps) {
  const { theme } = useTheme();
  const shellRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const readyRef = useRef(false);
  const selectedRef = useRef(selectedRegionId);
  const hoveredRef = useRef(hoveredRegionId);
  const onSelectRef = useRef(onSelectRegion);
  const onHoverRef = useRef(onHoverRegion);
  const onReadyRef = useRef(onReady);
  const onFullyLoadedRef = useRef(onFullyLoaded);
  const regionsRef = useRef(regions);
  const themeRef = useRef(theme);
  const epicenterRef = useRef(epicenter);
  const impactRegionsRef = useRef<ImpactRegionsGeoJson | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(showLoadingOverlay);
  const [overlayFading, setOverlayFading] = useState(false);
  const revealOverlayRef = useRef<() => void>(() => {});
  const fullyLoadedNotifiedRef = useRef(false);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    epicenterRef.current = epicenter;
  }, [epicenter]);

  function applyEpicenterToMap(
    map: Map,
    point: NonNullable<ColombiaMapProps["epicenter"]>,
  ) {
    if (!map.getSource(EPICENTER_SOURCE)) return;
    const source = map.getSource(EPICENTER_SOURCE) as GeoJSONSource;
    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            label: `Epicenter · ${point.magnitude.toFixed(1)} Mw`,
            magnitude: point.magnitude,
          },
          geometry: {
            type: "Point",
            coordinates: [point.longitude, point.latitude],
          },
        },
      ],
    });
  }

  useEffect(() => {
    selectedRef.current = selectedRegionId;
    hoveredRef.current = hoveredRegionId;
    onSelectRef.current = onSelectRegion;
    onHoverRef.current = onHoverRegion;
    onReadyRef.current = onReady;
    onFullyLoadedRef.current = onFullyLoaded;
    regionsRef.current = regions;
  }, [
    selectedRegionId,
    hoveredRegionId,
    onSelectRegion,
    onHoverRegion,
    onReady,
    onFullyLoaded,
    regions,
  ]);

  useEffect(() => {
    revealOverlayRef.current = () => {
      if (!fullyLoadedNotifiedRef.current) {
        fullyLoadedNotifiedRef.current = true;
        onFullyLoadedRef.current?.();
      }
      if (!showLoadingOverlay) return;
      setOverlayFading(true);
      window.setTimeout(() => setOverlayVisible(false), 520);
    };
  }, [showLoadingOverlay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !epicenter) return;
    applyEpicenterToMap(map, epicenter);
  }, [epicenter]);

  useEffect(() => {
    const shell = shellRef.current;
    const container = containerRef.current;
    if (!shell || !container || mapRef.current) return;

    let cancelled = false;
    let map: Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let mountIdleHandle: number | null = null;
    let revealFallbackHandle: number | null = null;
    let frame = 0;
    let styleReady = false;
    let dotsReady = false;

    const tryReveal = () => {
      if (cancelled || !styleReady || !dotsReady) return;
      revealOverlayRef.current();
    };

    const applyFeatureStates = () => {
      if (!map?.getSource(SOURCE_ID)) return;
      for (const region of regionsRef.current) {
        map.setFeatureState(
          { source: SOURCE_ID, id: region.id },
          {
            hover: region.id === hoveredRef.current,
            selected: region.id === selectedRef.current,
          },
        );
      }
    };

    const showPopup = (regionId: string, lngLat?: [number, number]) => {
      if (!map || !popupRef.current) return;
      const region = regionsRef.current.find((r) => r.id === regionId);
      const feature = impactRegionsRef.current?.features.find(
        (f) => f.properties.id === regionId,
      );
      if (!region) return;

      popupRef.current
        .setLngLat(
          lngLat ??
            (feature
              ? geometryCentroid(feature.geometry)
              : colombiaMapView.center),
        )
        .setHTML(
          `<strong>${region.name}</strong><div class="hc-map-popup-meta">Impact: ${region.severity}</div><div class="hc-map-popup-meta">Deaths: ${region.deaths}</div><div class="hc-map-popup-meta">Affected: ${region.affected}</div>`,
        )
        .addTo(map);
    };

    let LngLatBoundsCtor: typeof LngLatBounds | null = null;

    const focusRegionWithBounds = (
      regionId: string,
      geometry: LandGeometry,
    ) => {
      if (!map || !LngLatBoundsCtor) return;
      const bounds = new LngLatBoundsCtor();
      for (const ring of polygonExteriorRings(geometry)) {
        for (const coord of ring) {
          bounds.extend(coord as [number, number]);
        }
      }
      map.fitBounds(bounds, { padding: 64, maxZoom: 7.2, duration: 700 });
      showPopup(regionId);
    };

    const markReady = () => {
      if (!map || cancelled || readyRef.current) return;
      readyRef.current = true;
      styleReady = true;
      addBogotaLabelLayer(map, themeRef.current);
      applyFeatureStates();
      map.resize();
      onReadyRef.current?.({
        zoomIn: () => map?.zoomIn({ duration: 250 }),
        zoomOut: () => map?.zoomOut({ duration: 250 }),
        focusRegion: (regionId: string) => {
          const feature = impactRegionsRef.current?.features.find(
            (f) => f.properties.id === regionId,
          );
          if (feature) focusRegionWithBounds(regionId, feature.geometry);
          else showPopup(regionId);
        },
      });
      // Overlay covers this work — hydrate dots as soon as the style is up.
      hydrateDots();
      tryReveal();
    };

    const hydrateDots = () => {
      if (cancelled || !map) return;
      void fetchColombiaDotCloudGeoJson()
        .then((geojson) => {
          if (cancelled || !map) return;
          const source = map.getSource(DOTS_SOURCE) as
            | GeoJSONSource
            | undefined;
          source?.setData(geojson);
          // Wait one idle so circles paint before the overlay fades.
          map.once("idle", () => {
            dotsReady = true;
            tryReveal();
          });
          // If idle never fires (already idle), still clear soon.
          window.setTimeout(() => {
            if (cancelled || dotsReady) return;
            dotsReady = true;
            tryReveal();
          }, 400);
        })
        .catch((error) => {
          console.error("[ColombiaMap] dots", error);
          dotsReady = true;
          tryReveal();
        });
    };

    const start = async () => {
      if (cancelled || mapRef.current) return;
      if (container.clientWidth === 0 || container.clientHeight === 0) return;

      const maplibre = await import("maplibre-gl");
      if (cancelled || mapRef.current) return;

      maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      LngLatBoundsCtor = maplibre.LngLatBounds;

      // Prefetch impact polygons for popups / focus (not on critical paint path).
      void fetch(mapPublicUrls.impactRegions)
        .then((res) => res.json())
        .then((data: ImpactRegionsGeoJson) => {
          if (!cancelled) impactRegionsRef.current = data;
        })
        .catch((error) => {
          console.error("[ColombiaMap] impact regions", error);
        });

      map = new maplibre.Map({
        container,
        style: buildMapDesignStyle(themeRef.current),
        center: colombiaMapView.center,
        zoom: colombiaMapView.zoom,
        minZoom: colombiaMapView.minZoom,
        maxZoom: colombiaMapView.maxZoom,
        maxBounds: colombiaMapView.maxBounds,
        attributionControl: { compact: true },
        interactive,
        dragPan: true,
        dragRotate: false,
        pitchWithRotate: false,
      });

      map.jumpTo({
        center: colombiaMapView.center,
        zoom: colombiaMapView.zoom,
      });

      mapRef.current = map;
      popupRef.current = new maplibre.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        className: "hc-map-popup",
        maxWidth: "220px",
      });

      map.on("error", (event) => {
        console.error("[ColombiaMap]", event.error);
      });

      whenStyleReady(map, () => {
        if (!map) return;
        addBogotaLabelLayer(map, themeRef.current);
        const liveEpicenter = epicenterRef.current;
        if (liveEpicenter) applyEpicenterToMap(map, liveEpicenter);
        markReady();
      });
      map.once("idle", () => {
        if (!map) return;
        addBogotaLabelLayer(map, themeRef.current);
        const liveEpicenter = epicenterRef.current;
        if (liveEpicenter) applyEpicenterToMap(map, liveEpicenter);
        markReady();
      });

      // Safety: never leave the overlay stuck if a source stalls.
      revealFallbackHandle = window.setTimeout(() => {
        if (cancelled) return;
        styleReady = true;
        dotsReady = true;
        tryReveal();
      }, 8000);

      if (interactive) {
        map.on("mousemove", HIT_LAYER, (e: MapLayerMouseEvent) => {
          const id = regionIdFromEvent(e);
          map!.getCanvas().style.cursor = id ? "pointer" : "";
          onHoverRef.current(id);
          if (id) showPopup(id, [e.lngLat.lng, e.lngLat.lat]);
        });

        map.on("mouseleave", HIT_LAYER, () => {
          map!.getCanvas().style.cursor = "";
          onHoverRef.current(null);
          if (!selectedRef.current) popupRef.current?.remove();
        });

        map.on("click", HIT_LAYER, (e: MapLayerMouseEvent) => {
          const id = regionIdFromEvent(e);
          if (!id) return;
          onSelectRef.current(id);
          const feature = impactRegionsRef.current?.features.find(
            (f) => f.properties.id === id,
          );
          if (feature) focusRegionWithBounds(id, feature.geometry);
          else showPopup(id, [e.lngLat.lng, e.lngLat.lat]);
        });
      }

      resizeObserver = new ResizeObserver(() => {
        map?.resize();
      });
      resizeObserver.observe(shell);
    };

    // Let the dashboard chrome paint first, then mount MapLibre.
    mountIdleHandle = scheduleIdle(() => {
      frame = requestAnimationFrame(() => {
        void start();
        if (!mapRef.current) {
          resizeObserver = new ResizeObserver(() => {
            if (!mapRef.current) void start();
            else mapRef.current.resize();
          });
          resizeObserver.observe(shell);
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      if (mountIdleHandle != null) cancelIdle(mountIdleHandle);
      cancelAnimationFrame(frame);
      if (revealFallbackHandle != null) window.clearTimeout(revealFallbackHandle);
      readyRef.current = false;
      resizeObserver?.disconnect();
      popupRef.current?.remove();
      map?.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyMapThemePaints(map, theme);
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getSource(SOURCE_ID)) return;

    for (const region of regions) {
      map.setFeatureState(
        { source: SOURCE_ID, id: region.id },
        {
          hover: region.id === hoveredRegionId,
          selected: region.id === selectedRegionId,
        },
      );
    }
  }, [hoveredRegionId, selectedRegionId, regions]);

  return (
    <div
      ref={shellRef}
      className={cn(
        "overflow-hidden",
        layout === "viewport"
          ? "pointer-events-auto absolute inset-0 z-0"
          : "relative h-full w-full",
        className,
      )}
      role="presentation"
      aria-busy={overlayVisible && !overlayFading}
    >
      <div
        ref={containerRef}
        className="hc-map-root absolute inset-0 h-full w-full [&_.maplibregl-ctrl-attrib]:text-[10px]"
        aria-hidden="true"
      />
      {overlayVisible && showLoadingOverlay ? (
        <MapLoadingOverlay fading={overlayFading} />
      ) : null}
    </div>
  );
}
