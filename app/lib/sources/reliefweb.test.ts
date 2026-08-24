import { describe, expect, it, vi } from "vitest";
import {
  fetchReliefWebReports,
  normalizeReliefWebReports,
  reliefWebReportsResponseSchema,
} from "@/lib/sources/reliefweb";

const samplePayload = {
  totalCount: 2,
  count: 2,
  data: [
    {
      id: 424242,
      fields: {
        title: "Colombia: Earthquake flash update",
        url: "https://reliefweb.int/report/colombia/earthquake-flash-update",
        date: { original: "2025-08-18T10:00:00+00:00" },
        source: [{ name: "OCHA" }],
        "body-html": "<p>Should never be stored</p>",
      },
    },
    {
      id: "424242",
      fields: {
        title: "Duplicate id should be ignored",
        url: "https://reliefweb.int/report/colombia/dupe",
        date: { created: "2025-08-17T10:00:00+00:00" },
      },
    },
    {
      id: 99,
      fields: {
        title: "Second report",
        date: { created: "not-a-date" },
      },
    },
  ],
};

describe("reliefWebReportsResponseSchema", () => {
  it("accepts a typical list payload", () => {
    const parsed = reliefWebReportsResponseSchema.safeParse(samplePayload);
    expect(parsed.success).toBe(true);
  });

  it("rejects missing title", () => {
    const parsed = reliefWebReportsResponseSchema.safeParse({
      data: [{ id: 1, fields: {} }],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizeReliefWebReports", () => {
  it("dedupes by external id and never includes HTML bodies", () => {
    const parsed = reliefWebReportsResponseSchema.parse(samplePayload);
    const rows = normalizeReliefWebReports(
      parsed,
      () => new Date("2025-08-19T00:00:00.000Z"),
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      externalId: "424242",
      title: "Colombia: Earthquake flash update",
      summary: null,
      sourceUrl: "https://reliefweb.int/report/colombia/earthquake-flash-update",
      publishedAt: "2025-08-18T10:00:00.000Z",
      accent: "info",
    });
    expect(rows[1].externalId).toBe("99");
    expect(rows[1].publishedAt).toBeNull();
    expect(rows[1].sourceUrl).toBe("https://reliefweb.int/node/99");
    expect(JSON.stringify(rows)).not.toContain("body-html");
    expect(JSON.stringify(rows)).not.toContain("<p>");
  });
});

describe("fetchReliefWebReports", () => {
  it("validates and normalizes a successful upstream response", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(samplePayload, { status: 200 }),
    );

    const rows = await fetchReliefWebReports({
      appName: "helpcolombia-test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: () => new Date("2025-08-19T00:00:00.000Z"),
    });

    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toContain("Earthquake");
  });

  it("throws on non-OK upstream without returning rows", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("denied", { status: 403 }),
    );

    await expect(
      fetchReliefWebReports({
        appName: "helpcolombia-test",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/403/);
  });

  it("throws when validation fails", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ data: [{ id: 1, fields: {} }] }, { status: 200 }),
    );

    await expect(
      fetchReliefWebReports({
        appName: "helpcolombia-test",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/validation/);
  });
});
