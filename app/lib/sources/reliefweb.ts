import { z } from "zod";

const RELIEFWEB_REPORTS_URL = "https://api.reliefweb.int/v2/reports";

const reliefWebDateSchema = z
  .object({
    original: z.string().optional(),
    created: z.string().optional(),
    changed: z.string().optional(),
  })
  .passthrough();

const reliefWebSourceSchema = z.union([
  z.object({ name: z.string() }).passthrough(),
  z.array(z.object({ name: z.string() }).passthrough()),
]);

const reliefWebReportFieldsSchema = z
  .object({
    title: z.string().min(1),
    url: z.string().url().optional(),
    url_alias: z.string().url().optional(),
    date: reliefWebDateSchema.optional(),
    source: reliefWebSourceSchema.optional(),
    // Intentionally ignore body / body-html — never persist or expose raw HTML.
  })
  .passthrough();

const reliefWebReportItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fields: reliefWebReportFieldsSchema,
});

export const reliefWebReportsResponseSchema = z.object({
  totalCount: z.number().optional(),
  count: z.number().optional(),
  data: z.array(reliefWebReportItemSchema),
});

export type ReliefWebReportsResponse = z.infer<
  typeof reliefWebReportsResponseSchema
>;

export type NormalizedReliefWebUpdate = {
  externalId: string;
  title: string;
  summary: null;
  sourceUrl: string;
  publishedAt: string | null;
  retrievedAt: string;
  accent: "info";
};

export type FetchReliefWebOptions = {
  appName: string;
  /** ISO3 country code, default COL */
  countryIso3?: string;
  limit?: number;
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

function pickSourceUrl(
  id: string,
  fields: z.infer<typeof reliefWebReportFieldsSchema>,
): string {
  if (fields.url) return fields.url;
  if (fields.url_alias) return fields.url_alias;
  return `https://reliefweb.int/node/${id}`;
}

function pickPublishedAt(
  fields: z.infer<typeof reliefWebReportFieldsSchema>,
): string | null {
  const raw = fields.date?.original ?? fields.date?.created ?? null;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/**
 * Normalize validated ReliefWeb report items into updates-table rows.
 * Never includes HTML body content.
 */
export function normalizeReliefWebReports(
  response: ReliefWebReportsResponse,
  now: () => Date = () => new Date(),
): NormalizedReliefWebUpdate[] {
  const retrievedAt = now().toISOString();
  const seen = new Set<string>();
  const out: NormalizedReliefWebUpdate[] = [];

  for (const item of response.data) {
    const externalId = String(item.id);
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    out.push({
      externalId,
      title: item.fields.title.trim(),
      summary: null,
      sourceUrl: pickSourceUrl(externalId, item.fields),
      publishedAt: pickPublishedAt(item.fields),
      retrievedAt,
      accent: "info",
    });
  }

  return out;
}

/**
 * Server-only: fetch recent Colombia earthquake-related reports from ReliefWeb.
 */
export async function fetchReliefWebReports(
  options: FetchReliefWebOptions,
): Promise<NormalizedReliefWebUpdate[]> {
  const {
    appName,
    countryIso3 = "COL",
    limit = 20,
    fetchImpl = fetch,
    now = () => new Date(),
  } = options;

  if (!appName.trim()) {
    throw new Error("RELIEFWEB_APP_NAME is required");
  }

  const url = `${RELIEFWEB_REPORTS_URL}?appname=${encodeURIComponent(appName.trim())}`;

  const body = {
    limit,
    profile: "list",
    sort: ["date.original:desc"],
    fields: {
      include: ["title", "url", "url_alias", "date", "source"],
    },
    filter: {
      operator: "AND",
      conditions: [
        { field: "country.iso3", value: countryIso3 },
        { field: "disaster_type", value: "Earthquake" },
      ],
    },
  };

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    // Avoid Next.js fetch caching for scheduled ingestion.
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `ReliefWeb request failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = reliefWebReportsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `ReliefWeb response failed validation: ${parsed.error.message}`,
    );
  }

  return normalizeReliefWebReports(parsed.data, now);
}
