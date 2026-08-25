import { describe, expect, it, vi } from "vitest";
import {
  fetchFtsFundingFlows,
  mapFtsStatus,
  normalizeFtsFlows,
  ftsFlowResponseSchema,
} from "@/lib/sources/fts";
import {
  aggregateFundingFlows,
  filterFundingFlowsSince,
  mapSectorLabel,
} from "@/lib/funding/aggregate";

const sampleResponse = {
  status: "ok",
  data: {
    incoming: {
      flowCount: 3,
      fundingTotal: 1000,
      pledgeTotal: 100,
    },
    flows: [
      {
        id: 1,
        amountUSD: 100,
        status: "pledge",
        boundary: "incoming",
        firstReportedDate: "2025-01-01T00:00:00Z",
        sourceObjects: [{ type: "Organization", name: "Donor A" }],
        destinationObjects: [
          { type: "Organization", name: "Recipient A" },
          { type: "GlobalCluster", name: "Health" },
        ],
      },
      {
        id: 2,
        amountUSD: 400,
        status: "commitment",
        boundary: "incoming",
        sourceObjects: [{ type: "Organization", name: "Donor B" }],
        destinationObjects: [
          { type: "Organization", name: "Recipient B" },
          { type: "GlobalCluster", name: "Food Security" },
        ],
      },
      {
        id: 3,
        amountUSD: 500,
        status: "paid",
        boundary: "incoming",
        sourceObjects: [{ type: "Organization", name: "Donor C" }],
        destinationObjects: [
          { type: "Organization", name: "Recipient C" },
          { type: "GlobalCluster", name: "Emergency Shelter and NFI" },
        ],
      },
      {
        id: 4,
        amountUSD: 999,
        status: "paid",
        boundary: "outgoing",
        sourceObjects: [{ type: "Organization", name: "Skip" }],
        destinationObjects: [],
      },
      {
        id: 5,
        amountUSD: 50,
        status: "mystery-status",
        boundary: "incoming",
        sourceObjects: [{ type: "Organization", name: "Donor D" }],
        destinationObjects: [{ type: "GlobalCluster", name: "Education" }],
      },
    ],
  },
};

describe("mapFtsStatus", () => {
  it("maps known statuses without inventing unknowns", () => {
    expect(mapFtsStatus("pledge").status).toBe("pledged");
    expect(mapFtsStatus("commitment").status).toBe("committed");
    expect(mapFtsStatus("paid").status).toBe("received");
    expect(mapFtsStatus("weird").status).toBe("unknown");
    expect(mapFtsStatus("weird").upstreamStatus).toBe("weird");
  });
});

describe("normalizeFtsFlows", () => {
  it("keeps incoming flows and preserves upstream status", () => {
    const parsed = ftsFlowResponseSchema.parse(sampleResponse);
    const flows = normalizeFtsFlows(parsed, {
      now: () => new Date("2025-08-01T00:00:00.000Z"),
    });
    expect(flows).toHaveLength(4);
    expect(flows.find((f) => f.externalId === "4")).toBeUndefined();
    expect(flows.find((f) => f.externalId === "5")?.status).toBe("unknown");
    expect(flows.find((f) => f.externalId === "3")?.sector).toContain("Shelter");
  });
});

describe("aggregateFundingFlows", () => {
  it("sums by mapped status and builds sector percents", () => {
    const parsed = ftsFlowResponseSchema.parse(sampleResponse);
    const flows = normalizeFtsFlows(parsed);
    const { totals, sums, sectors } = aggregateFundingFlows(flows);
    expect(sums.pledged).toBe(100);
    expect(sums.committed).toBe(400);
    expect(sums.received).toBe(500);
    expect(sums.unknown).toBe(50);
    expect(totals.find((t) => t.id === "pledged")?.value).toContain("$");
    expect(sectors.length).toBeGreaterThan(0);
    expect(sectors.reduce((acc, s) => acc + s.percent, 0)).toBe(100);
  });
});

describe("filterFundingFlowsSince", () => {
  it("keeps only flows on or after the cutoff", () => {
    const flows = [
      {
        externalId: "old",
        donor: "A",
        recipient: "B",
        amountUsd: 1,
        status: "committed" as const,
        upstreamStatus: "commitment",
        sector: "Health",
        sourceUrl: "",
        reportedAt: "2026-08-09T12:00:00.000Z",
        retrievedAt: "2026-08-24T00:00:00.000Z",
      },
      {
        externalId: "new",
        donor: "A",
        recipient: "B",
        amountUsd: 2,
        status: "received" as const,
        upstreamStatus: "paid",
        sector: "Health",
        sourceUrl: "",
        reportedAt: "2026-08-10T12:34:00.000Z",
        retrievedAt: "2026-08-24T00:00:00.000Z",
      },
      {
        externalId: "undated",
        donor: "A",
        recipient: "B",
        amountUsd: 3,
        status: "pledged" as const,
        upstreamStatus: "pledge",
        sector: "Health",
        sourceUrl: "",
        reportedAt: null,
        retrievedAt: "2026-08-24T00:00:00.000Z",
      },
    ];

    const scoped = filterFundingFlowsSince(flows, "2026-08-10T12:34:00.000Z");
    expect(scoped.map((f) => f.externalId)).toEqual(["new"]);
  });
});

describe("mapSectorLabel", () => {
  it("maps common FTS cluster names", () => {
    expect(mapSectorLabel("Emergency Shelter and NFI")).toBe("Shelter");
    expect(mapSectorLabel("Food Security")).toBe("Food");
    expect(mapSectorLabel(null)).toBe("Other");
  });
});

describe("fetchFtsFundingFlows", () => {
  it("validates a successful response", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(sampleResponse, { status: 200 }),
    );
    const flows = await fetchFtsFundingFlows({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      year: 2025,
    });
    expect(flows.length).toBe(4);
  });

  it("throws on upstream failure", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(
      fetchFtsFundingFlows({
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/500/);
  });
});
