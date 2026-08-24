import { describe, expect, it, vi } from "vitest";
import {
  buildIfrcHelpSummary,
  normalizeIfrcOperation,
  pickPeopleReached,
  selectColombiaEarthquakeEvent,
  ifrcEventListResponseSchema,
  ifrcFieldReportListSchema,
  ifrcSituationReportListSchema,
  fetchIfrcColombiaEarthquakeOperation,
} from "@/lib/sources/ifrc";

const sampleEventList = {
  count: 2,
  results: [
    {
      id: 7527,
      name: "COL: Earthquake - 06-2025",
      disaster_start_date: "2025-06-08T00:00:00Z",
      dtype: { id: 2, name: "Earthquake" },
      countries: [{ iso3: "COL", id: 48 }],
      appeals: [],
    },
    {
      id: 8055,
      name: "Colombia - Earthquake 2026",
      disaster_start_date: "2026-08-10T00:00:00Z",
      dtype: { id: 2, name: "Earthquake" },
      countries: ["COL"],
      appeals: [
        {
          id: 4480,
          code: "MDRCO036",
          name: "Colombia - Earthquake",
          num_beneficiaries: 24000,
          amount_requested: 10000000,
          amount_funded: 0,
          status_display: "Active",
          start_date: "2026-08-11T00:00:00Z",
        },
      ],
    },
  ],
};

const sampleFieldReports = {
  count: 1,
  results: [
    {
      id: 18523,
      event: 8055,
      title: "2026 Colombia Earthquake",
      created_at: "2026-08-10T15:19:06Z",
      num_assisted: null,
      actions_taken: [
        {
          organization: "NTLS",
          summary: "National Society activated crisis center.",
          actions_details: [
            { id: 28, name: "Search & Rescue" },
            { id: 37, name: "First Aid" },
          ],
        },
      ],
    },
  ],
};

const sampleSitreps = {
  count: 2,
  results: [
    {
      id: 6714,
      name: "SitRep#14 Cruz Roja Colombiana ESP - 23/08/26",
      created_at: "2026-08-23T20:24:16Z",
      document: "https://example.com/sitrep14.pdf",
      type: { type: "Situation Reports", id: 5, is_primary: true },
    },
    {
      id: 6712,
      name: "Colombia Earthquake - Mob Table",
      created_at: "2026-08-20T22:31:46Z",
      document: "https://example.com/mob.pdf",
      type: {
        type: "Logistics Documents and Mobilisation Tables",
        id: 6,
        is_primary: true,
      },
    },
  ],
};

describe("selectColombiaEarthquakeEvent", () => {
  it("prefers events with appeals over older quakes", () => {
    const parsed = ifrcEventListResponseSchema.parse(sampleEventList);
    const selected = selectColombiaEarthquakeEvent(parsed.results);
    expect(selected?.id).toBe(8055);
  });
});

describe("pickPeopleReached", () => {
  it("returns null when no field report reports assisted people", () => {
    expect(pickPeopleReached(sampleFieldReports.results)).toBeNull();
  });

  it("uses the latest non-null num_assisted only", () => {
    expect(
      pickPeopleReached([
        {
          id: 1,
          created_at: "2026-08-11T00:00:00Z",
          num_assisted: 100,
        },
        {
          id: 2,
          created_at: "2026-08-12T00:00:00Z",
          num_assisted: null,
        },
        {
          id: 3,
          created_at: "2026-08-10T00:00:00Z",
          num_assisted: 50,
        },
      ]),
    ).toBe(100);
  });
});

describe("normalizeIfrcOperation", () => {
  it("maps appeal target population and activities without inventing reach", () => {
    const event = ifrcEventListResponseSchema.parse(sampleEventList).results[1]!;
    const fieldReports = ifrcFieldReportListSchema.parse(sampleFieldReports).results;
    const sitreps = ifrcSituationReportListSchema.parse(sampleSitreps).results;

    const normalized = normalizeIfrcOperation({
      event,
      fieldReports,
      situationReports: sitreps,
      now: () => new Date("2026-08-24T12:00:00.000Z"),
    });

    expect(normalized.appealCode).toBe("MDRCO036");
    expect(normalized.targetPopulation).toBe(24000);
    expect(normalized.peopleReached).toBeNull();
    expect(normalized.activities).toEqual(
      expect.arrayContaining(["Search & Rescue", "First Aid"]),
    );
    expect(normalized.opsUpdates).toHaveLength(1);
    expect(normalized.opsUpdates[0]?.title).toContain("SitRep#14");
    expect(normalized.currencyCode).toBe("CHF");
  });
});

describe("buildIfrcHelpSummary", () => {
  it("only includes sourced metrics", () => {
    const event = ifrcEventListResponseSchema.parse(sampleEventList).results[1]!;
    const fieldReports = ifrcFieldReportListSchema.parse(sampleFieldReports).results;
    const normalized = normalizeIfrcOperation({
      event,
      fieldReports,
      situationReports: [],
    });
    const summary = buildIfrcHelpSummary(normalized, "fallback");
    expect(summary).toContain("MDRCO036");
    expect(summary).toContain("24,000");
    expect(summary).not.toMatch(/people reached/i);
    expect(summary).toContain("Search & Rescue");
  });
});

describe("fetchIfrcColombiaEarthquakeOperation", () => {
  it("filters field reports by event id", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/event/?") && url.includes("countries__in")) {
        return new Response(JSON.stringify(sampleEventList), { status: 200 });
      }
      if (url.includes("/event/8055/")) {
        return new Response(JSON.stringify(sampleEventList.results[1]), {
          status: 200,
        });
      }
      if (url.includes("/field-report/")) {
        return new Response(
          JSON.stringify({
            count: 2,
            results: [
              ...sampleFieldReports.results,
              {
                id: 999,
                event: 111,
                title: "Other country",
                num_assisted: 9999,
                actions_taken: [],
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes("/situation_report/")) {
        return new Response(JSON.stringify(sampleSitreps), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    });

    const operation = await fetchIfrcColombiaEarthquakeOperation({
      fetchImpl: fetchImpl as typeof fetch,
      now: () => new Date("2026-08-24T12:00:00.000Z"),
    });

    expect(operation?.externalEventId).toBe("8055");
    expect(operation?.peopleReached).toBeNull();
    expect(operation?.targetPopulation).toBe(24000);
  });
});
