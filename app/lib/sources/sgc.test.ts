import { describe, expect, it, vi } from "vitest";
import {
  fetchSgcSeismicSnapshot,
  normalizeSgcFeed,
  sgcFiveDaysFeedSchema,
} from "@/lib/sources/sgc";

const sampleFeed = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      id: "SGC-PRIMARY",
      geometry: {
        type: "Point" as const,
        // archive order: [lat, lng, depth]
        coordinates: [5.92, -77.42, 30] as [number, number, number],
      },
      properties: {
        agency: "SGC",
        type: "earthquake",
        mag: 6.1,
        magType: "Mw",
        place: "Nuquí - Chocó, Colombia",
        closerTowns: "27 km NW of Nuquí, Chocó",
        utcTime: "2025-08-17 17:04",
        localTime: "2025-08-17 12:04",
        status: "manual",
      },
    },
    {
      type: "Feature" as const,
      id: "SGC-AFTER-1",
      geometry: {
        type: "Point" as const,
        coordinates: [5.95, -77.4, 28] as [number, number, number],
      },
      properties: {
        agency: "SGC",
        type: "earthquake",
        mag: 4.2,
        place: "Near Nuquí",
        utcTime: "2025-08-17 18:10",
        status: "automatic",
      },
    },
    {
      type: "Feature" as const,
      id: "USGS-SKIP",
      geometry: {
        type: "Point" as const,
        coordinates: [5.9, -77.4, 20] as [number, number, number],
      },
      properties: {
        agency: "USGS",
        type: "earthquake",
        mag: 7.0,
        utcTime: "2025-08-17 17:05",
      },
    },
  ],
};

describe("sgcFiveDaysFeedSchema", () => {
  it("accepts archive feed features", () => {
    expect(sgcFiveDaysFeedSchema.safeParse(sampleFeed).success).toBe(true);
  });
});

describe("normalizeSgcFeed", () => {
  it("picks the strongest SGC event and counts nearby aftershocks", () => {
    const parsed = sgcFiveDaysFeedSchema.parse(sampleFeed);
    const snapshot = normalizeSgcFeed(parsed, {
      now: () => new Date("2025-08-18T00:00:00.000Z"),
      minPrimaryMagnitude: 4,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.primary.externalId).toBe("SGC-PRIMARY");
    expect(snapshot?.primary.latitude).toBeCloseTo(5.92);
    expect(snapshot?.primary.longitude).toBeCloseTo(-77.42);
    expect(snapshot?.primary.depthKm).toBe(30);
    expect(snapshot?.aftershockCount).toBe(1);
    expect(snapshot?.epicenterLabel).toContain("Nuquí");
    expect(snapshot?.primary.sourceUrl).toContain("SGC-PRIMARY");
  });

  it("honors an explicit primaryEventId", () => {
    const parsed = sgcFiveDaysFeedSchema.parse(sampleFeed);
    const snapshot = normalizeSgcFeed(parsed, {
      primaryEventId: "SGC-AFTER-1",
    });
    expect(snapshot?.primary.externalId).toBe("SGC-AFTER-1");
  });

  it("ignores non-SGC agencies", () => {
    const parsed = sgcFiveDaysFeedSchema.parse(sampleFeed);
    const snapshot = normalizeSgcFeed(parsed);
    expect(snapshot?.primary.externalId).not.toBe("USGS-SKIP");
  });
});

describe("fetchSgcSeismicSnapshot", () => {
  it("validates and normalizes a successful upstream response", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(sampleFeed, { status: 200 }),
    );

    const snapshot = await fetchSgcSeismicSnapshot({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => new Date("2025-08-18T00:00:00.000Z"),
    });

    expect(snapshot.primary.magnitude).toBe(6.1);
    expect(snapshot.aftershockCount).toBe(1);
  });

  it("throws on non-OK upstream without returning a snapshot", async () => {
    const fetchImpl = vi.fn(async () => new Response("down", { status: 502 }));
    await expect(
      fetchSgcSeismicSnapshot({
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/502/);
  });
});
