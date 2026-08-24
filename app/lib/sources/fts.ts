import { z } from "zod";

const FTS_FLOW_URL = "https://api.hpc.tools/v1/public/fts/flow";

const ftsNamedObjectSchema = z
  .object({
    type: z.string(),
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
  })
  .passthrough();

const ftsFlowSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    amountUSD: z.number().optional(),
    status: z.string().optional(),
    date: z.string().optional(),
    firstReportedDate: z.string().optional(),
    updatedAt: z.string().optional(),
    description: z.string().optional(),
    sourceObjects: z.array(ftsNamedObjectSchema).optional(),
    destinationObjects: z.array(ftsNamedObjectSchema).optional(),
    boundary: z.string().optional(),
  })
  .passthrough();

export const ftsFlowResponseSchema = z.object({
  status: z.string().optional(),
  data: z.object({
    incoming: z
      .object({
        flowCount: z.number().optional(),
        fundingTotal: z.number().optional(),
        pledgeTotal: z.number().optional(),
      })
      .passthrough()
      .optional(),
    flows: z.array(ftsFlowSchema),
  }),
});

export type FtsFlowResponse = z.infer<typeof ftsFlowResponseSchema>;

export type NormalizedFundingStatus =
  | "pledged"
  | "committed"
  | "received"
  | "unknown";

export type NormalizedFundingFlow = {
  externalId: string;
  donor: string | null;
  recipient: string | null;
  amountUsd: number;
  status: NormalizedFundingStatus;
  upstreamStatus: string | null;
  sector: string | null;
  sourceUrl: string;
  reportedAt: string | null;
  retrievedAt: string;
};

/**
 * Map upstream FTS status strings to display buckets.
 * Unknown statuses stay `unknown` — never invented.
 */
export function mapFtsStatus(upstream: string | null | undefined): {
  status: NormalizedFundingStatus;
  upstreamStatus: string | null;
} {
  if (!upstream?.trim()) {
    return { status: "unknown", upstreamStatus: null };
  }
  const raw = upstream.trim();
  const key = raw.toLowerCase();
  if (key === "pledge" || key === "pledged") {
    return { status: "pledged", upstreamStatus: raw };
  }
  if (key === "commitment" || key === "committed") {
    return { status: "committed", upstreamStatus: raw };
  }
  if (key === "paid" || key === "payment" || key === "received") {
    return { status: "received", upstreamStatus: raw };
  }
  return { status: "unknown", upstreamStatus: raw };
}

function firstOrgName(
  objects: z.infer<typeof ftsNamedObjectSchema>[] | undefined,
): string | null {
  const org = objects?.find(
    (item) => item.type === "Organization" && item.name?.trim(),
  );
  return org?.name?.trim() ?? null;
}

function pickSector(
  objects: z.infer<typeof ftsNamedObjectSchema>[] | undefined,
): string | null {
  const global = objects?.find(
    (item) => item.type === "GlobalCluster" && item.name?.trim(),
  );
  if (global?.name) return global.name.trim();
  const local = objects?.find(
    (item) => item.type === "Cluster" && item.name?.trim(),
  );
  return local?.name?.trim() ?? null;
}

function parseIso(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function normalizeFtsFlows(
  response: FtsFlowResponse,
  options: { now?: () => Date; countryIso3?: string } = {},
): NormalizedFundingFlow[] {
  const retrievedAt = (options.now ?? (() => new Date()))().toISOString();
  const countryIso3 = options.countryIso3 ?? "COL";
  const seen = new Set<string>();
  const out: NormalizedFundingFlow[] = [];

  for (const flow of response.data.flows) {
    // Prefer incoming boundary flows for country funding picture.
    if (flow.boundary && flow.boundary !== "incoming") continue;

    const externalId = String(flow.id);
    if (seen.has(externalId)) continue;
    seen.add(externalId);

    const amount = Number(flow.amountUSD ?? 0);
    if (!Number.isFinite(amount) || amount < 0) continue;

    const mapped = mapFtsStatus(flow.status);
    out.push({
      externalId,
      donor: firstOrgName(flow.sourceObjects),
      recipient: firstOrgName(flow.destinationObjects),
      amountUsd: amount,
      status: mapped.status,
      upstreamStatus: mapped.upstreamStatus,
      sector: pickSector(flow.destinationObjects),
      sourceUrl: `https://fts.unocha.org/countries/${countryIso3}/flows/${externalId}`,
      reportedAt:
        parseIso(flow.firstReportedDate) ??
        parseIso(flow.date) ??
        parseIso(flow.updatedAt),
      retrievedAt,
    });
  }

  return out;
}

export type FetchFtsOptions = {
  countryIso3?: string;
  year?: number;
  limit?: number;
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

/**
 * Server-only: fetch OCHA FTS flows for a country/year.
 */
export async function fetchFtsFundingFlows(
  options: FetchFtsOptions = {},
): Promise<NormalizedFundingFlow[]> {
  const {
    countryIso3 = "COL",
    year = new Date().getUTCFullYear(),
    limit = 1000,
    fetchImpl = fetch,
    now = () => new Date(),
  } = options;

  const url = new URL(FTS_FLOW_URL);
  url.searchParams.set("countryISO3", countryIso3);
  url.searchParams.set("year", String(year));
  url.searchParams.set("limit", String(limit));

  const response = await fetchImpl(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `FTS request failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  const json: unknown = await response.json();
  const parsed = ftsFlowResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`FTS response failed validation: ${parsed.error.message}`);
  }

  return normalizeFtsFlows(parsed.data, { now, countryIso3 });
}
