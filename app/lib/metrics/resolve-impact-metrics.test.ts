import { describe, expect, it } from "vitest";
import { sourcePriorityScore } from "@/lib/metrics/source-priority";
import {
  resolveImpactMetric,
  type ImpactMetricObservation,
} from "@/lib/metrics/resolve-impact-metrics";
import { ungrdMetricsImportSchema } from "@/lib/metrics/import-structured-metrics";

function obs(
  partial: Partial<ImpactMetricObservation> &
    Pick<ImpactMetricObservation, "id" | "metricType" | "value" | "sourceName">,
): ImpactMetricObservation {
  return {
    unit: "count",
    displayValue: null,
    detail: null,
    department: null,
    municipality: null,
    sourceId: null,
    trustTier: "other",
    sourceUrl: null,
    reportedAt: "2025-08-18T12:00:00.000Z",
    retrievedAt: "2025-08-18T13:00:00.000Z",
    ...partial,
  };
}

describe("sourcePriorityScore", () => {
  it("ranks Colombian official sources highest", () => {
    expect(
      sourcePriorityScore({ trustTier: "official", sourceName: "UNGRD" }),
    ).toBeGreaterThan(
      sourcePriorityScore({ trustTier: "official", sourceName: "UN OCHA" }),
    );
  });
});

describe("resolveImpactMetric", () => {
  it("prefers UNGRD over media and never averages", () => {
    const resolved = resolveImpactMetric({
      metricType: "deaths",
      observations: [
        obs({
          id: "media",
          metricType: "deaths",
          value: 450,
          displayValue: "450",
          sourceName: "Example News",
          trustTier: "verified_media",
          reportedAt: "2025-08-19T12:00:00.000Z",
        }),
        obs({
          id: "ungrd",
          metricType: "deaths",
          value: 312,
          displayValue: "312+",
          sourceName: "UNGRD",
          trustTier: "official",
          reportedAt: "2025-08-18T12:00:00.000Z",
        }),
      ],
    });

    expect(resolved?.value).toBe(312);
    expect(resolved?.displayValue).toBe("312+");
    expect(resolved?.provenance.sourceName).toBe("UNGRD");
    expect(resolved?.alternatives).toHaveLength(1);
    expect(resolved?.alternatives[0].value).toBe(450);
  });

  it("among equal trust, prefers newer reported_at", () => {
    const resolved = resolveImpactMetric({
      metricType: "affected",
      observations: [
        obs({
          id: "older",
          metricType: "affected",
          value: 50000,
          sourceName: "UN OCHA",
          trustTier: "official",
          reportedAt: "2025-08-17T12:00:00.000Z",
        }),
        obs({
          id: "newer",
          metricType: "affected",
          value: 68400,
          displayValue: "68,400+",
          sourceName: "UN OCHA",
          trustTier: "official",
          reportedAt: "2025-08-18T12:00:00.000Z",
        }),
      ],
    });

    expect(resolved?.value).toBe(68400);
    expect(resolved?.provenance.observationId).toBe("newer");
  });

  it("scopes geography so national and department rows do not mix", () => {
    const resolved = resolveImpactMetric({
      metricType: "deaths",
      department: "Chocó",
      observations: [
        obs({
          id: "national",
          metricType: "deaths",
          value: 312,
          sourceName: "UNGRD",
          trustTier: "official",
          department: null,
        }),
        obs({
          id: "choco",
          metricType: "deaths",
          value: 128,
          displayValue: "128+",
          sourceName: "UNGRD",
          trustTier: "official",
          department: "Chocó",
        }),
      ],
    });

    expect(resolved?.value).toBe(128);
    expect(resolved?.department).toBe("Chocó");
  });

  it("returns null when metric is missing", () => {
    expect(
      resolveImpactMetric({
        metricType: "displaced",
        observations: [
          obs({
            id: "deaths",
            metricType: "deaths",
            value: 1,
            sourceName: "UNGRD",
            trustTier: "official",
          }),
        ],
      }),
    ).toBeNull();
  });
});

describe("ungrdMetricsImportSchema", () => {
  it("accepts a structured UNGRD payload", () => {
    const parsed = ungrdMetricsImportSchema.safeParse({
      disasterSlug: "colombia-earthquake-2025-08-17",
      sourceName: "UNGRD",
      reportedAt: "2025-08-20T15:00:00.000Z",
      metrics: [
        {
          metricType: "deaths",
          value: 320,
          displayValue: "320+",
          detail: "Confirmed",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects scraping-style empty metrics", () => {
    const parsed = ungrdMetricsImportSchema.safeParse({
      metrics: [],
    });
    expect(parsed.success).toBe(false);
  });
});
