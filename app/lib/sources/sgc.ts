import { z } from "zod";

const SGC_FIVE_DAYS_URL =
  "https://archive.sgc.gov.co/feed/v1.0.1/summary/five_days_all.json";

/** Archive feed uses [lat, lng, depth], not GeoJSON [lng, lat, depth]. */
const sgcArchiveCoordinatesSchema = z
  .tuple([z.number(), z.number(), z.number()])
  .or(z.tuple([z.number(), z.number()]));

const sgcFeaturePropertiesSchema = z
  .object({
    agency: z.string().optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    mag: z.number(),
    magType: z.string().optional(),
    place: z.string().optional(),
    closerTowns: z.string().optional(),
    utcTime: z.string().min(1),
    localTime: z.string().optional(),
    mmi: z.number().optional(),
  })
  .passthrough();

const sgcFeatureSchema = z.object({
  type: z.literal("Feature"),
  id: z.union([z.string(), z.number()]),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: sgcArchiveCoordinatesSchema,
  }),
  properties: sgcFeaturePropertiesSchema,
});

export const sgcFiveDaysFeedSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(sgcFeatureSchema),
});

export type SgcFiveDaysFeed = z.infer<typeof sgcFiveDaysFeedSchema>;

export type NormalizedSeismicEvent = {
  externalId: string;
  magnitude: number;
  magnitudeType: string | null;
  /** WGS84 */
  latitude: number;
  longitude: number;
  depthKm: number;
  place: string;
  closerTowns: string | null;
  occurredAtUtc: string;
  localTimeLabel: string | null;
  reviewStatus: string | null;
  sourceUrl: string;
  retrievedAt: string;
};

export type NormalizedSeismicSnapshot = {
  primary: NormalizedSeismicEvent;
  aftershockCount: number;
  aftershocksLabel: string;
  epicenterLabel: string;
};

export type FetchSgcOptions = {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  /** Prefer this SGC event id when present in the feed */
  primaryEventId?: string;
  minPrimaryMagnitude?: number;
  aftershockRadiusKm?: number;
};

const COLOMBIA_BBOX = {
  minLat: -4.5,
  maxLat: 13.5,
  minLng: -82,
  maxLng: -66,
};

function parseUtcTime(raw: string): string | null {
  // Feed examples: "2026-08-24 19:24" (UTC per field name)
  const normalized = raw.includes("T")
    ? raw
    : raw.replace(" ", "T") + (raw.length <= 16 ? ":00" : "");
  const withZ = /Z$|[+-]\d{2}:?\d{2}$/.test(normalized)
    ? normalized
    : `${normalized}Z`;
  const date = new Date(withZ);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function inColombiaBbox(lat: number, lng: number): boolean {
  return (
    lat >= COLOMBIA_BBOX.minLat &&
    lat <= COLOMBIA_BBOX.maxLat &&
    lng >= COLOMBIA_BBOX.minLng &&
    lng <= COLOMBIA_BBOX.maxLng
  );
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function buildEpicenterLabel(event: NormalizedSeismicEvent): string {
  if (event.closerTowns) {
    const first = event.closerTowns.split(",")[0]?.trim();
    if (first) return first;
  }
  return event.place || "Epicenter pending";
}

function buildAftershocksLabel(count: number): string {
  if (count <= 0) return "Aftershock count pending";
  if (count >= 100) return `${count}+ aftershocks recorded`;
  return `${count} aftershock${count === 1 ? "" : "s"} recorded`;
}

function toNormalizedEvent(
  feature: z.infer<typeof sgcFeatureSchema>,
  retrievedAt: string,
): NormalizedSeismicEvent | null {
  const agency = feature.properties.agency?.toUpperCase();
  if (agency && agency !== "SGC") return null;
  if (feature.properties.type && feature.properties.type !== "earthquake") {
    return null;
  }

  const [lat, lng, depth = 0] = feature.geometry.coordinates;
  if (!inColombiaBbox(lat, lng)) return null;

  const occurredAtUtc = parseUtcTime(feature.properties.utcTime);
  if (!occurredAtUtc) return null;

  const externalId = String(feature.id);
  return {
    externalId,
    magnitude: feature.properties.mag,
    magnitudeType: feature.properties.magType ?? null,
    latitude: lat,
    longitude: lng,
    depthKm: depth,
    place: feature.properties.place?.trim() || "Colombia",
    closerTowns: feature.properties.closerTowns?.trim() || null,
    occurredAtUtc,
    localTimeLabel: feature.properties.localTime?.trim() || null,
    reviewStatus: feature.properties.status ?? null,
    sourceUrl: `https://archive.sgc.gov.co/events/${encodeURIComponent(externalId)}/detail.json`,
    retrievedAt,
  };
}

/**
 * Pick primary shock + aftershock summary from a validated SGC feed.
 */
export function normalizeSgcFeed(
  feed: SgcFiveDaysFeed,
  options: {
    now?: () => Date;
    primaryEventId?: string;
    minPrimaryMagnitude?: number;
    aftershockRadiusKm?: number;
  } = {},
): NormalizedSeismicSnapshot | null {
  const retrievedAt = (options.now ?? (() => new Date()))().toISOString();
  const minMag = options.minPrimaryMagnitude ?? 4;
  const radiusKm = options.aftershockRadiusKm ?? 120;

  const events = feed.features
    .map((feature) => toNormalizedEvent(feature, retrievedAt))
    .filter((event): event is NormalizedSeismicEvent => Boolean(event))
    .sort(
      (a, b) =>
        new Date(b.occurredAtUtc).getTime() - new Date(a.occurredAtUtc).getTime(),
    );

  if (events.length === 0) return null;

  let primary: NormalizedSeismicEvent | undefined;
  if (options.primaryEventId) {
    primary = events.find((e) => e.externalId === options.primaryEventId);
  }
  if (!primary) {
    primary = [...events]
      .filter((e) => e.magnitude >= minMag)
      .sort((a, b) => b.magnitude - a.magnitude || a.occurredAtUtc.localeCompare(b.occurredAtUtc))[0];
  }
  // Fallback: strongest event in feed if none meet min magnitude.
  if (!primary) {
    primary = [...events].sort((a, b) => b.magnitude - a.magnitude)[0];
  }
  if (!primary) return null;

  const primaryTime = new Date(primary.occurredAtUtc).getTime();
  const aftershockCount = events.filter((event) => {
    if (event.externalId === primary.externalId) return false;
    if (new Date(event.occurredAtUtc).getTime() < primaryTime) return false;
    if (event.magnitude >= primary.magnitude) return false;
    const distance = haversineKm(
      primary.latitude,
      primary.longitude,
      event.latitude,
      event.longitude,
    );
    return distance <= radiusKm;
  }).length;

  return {
    primary,
    aftershockCount,
    aftershocksLabel: buildAftershocksLabel(aftershockCount),
    epicenterLabel: buildEpicenterLabel(primary),
  };
}

/**
 * Server-only: fetch the SGC five-day summary feed and normalize.
 */
export async function fetchSgcSeismicSnapshot(
  options: FetchSgcOptions = {},
): Promise<NormalizedSeismicSnapshot> {
  const {
    fetchImpl = fetch,
    now = () => new Date(),
    primaryEventId,
    minPrimaryMagnitude,
    aftershockRadiusKm,
  } = options;

  const response = await fetchImpl(SGC_FIVE_DAYS_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "HelpColombia/0.1 (disaster-aid dashboard; seismic ingest)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `SGC feed request failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = sgcFiveDaysFeedSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`SGC feed failed validation: ${parsed.error.message}`);
  }

  const snapshot = normalizeSgcFeed(parsed.data, {
    now,
    primaryEventId,
    minPrimaryMagnitude,
    aftershockRadiusKm,
  });
  if (!snapshot) {
    throw new Error("SGC feed contained no usable SGC earthquake events");
  }

  return snapshot;
}
