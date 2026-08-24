import { z } from "zod";

export const IFRC_API_BASE = "https://goadmin.ifrc.org/api/v2";
export const IFRC_COLOMBIA_COUNTRY_ID = 48;
/** IFRC disaster type id for Earthquake */
export const IFRC_EARTHQUAKE_DTYPE_ID = 2;

const namedRefSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
  })
  .passthrough();

const appealEmbeddedSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    code: z.string().optional(),
    name: z.string().optional(),
    num_beneficiaries: z.number().nullable().optional(),
    amount_requested: z.number().nullable().optional(),
    amount_funded: z.number().nullable().optional(),
    status_display: z.string().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    atype_display: z.string().optional(),
  })
  .passthrough();

export const ifrcEventListItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional(),
    disaster_start_date: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
    num_affected: z.number().nullable().optional(),
    dtype: z.union([z.number(), namedRefSchema]).optional(),
    appeals: z.array(appealEmbeddedSchema).optional(),
    countries: z
      .array(
        z.union([
          z.string(),
          z
            .object({
              iso3: z.string().nullable().optional(),
              id: z.union([z.string(), z.number()]).optional(),
            })
            .passthrough(),
        ]),
      )
      .optional(),
  })
  .passthrough();

export const ifrcEventListResponseSchema = z.object({
  count: z.number().optional(),
  results: z.array(ifrcEventListItemSchema),
});

const actionDetailSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    category: z.string().optional(),
  })
  .passthrough();

const actionsTakenSchema = z
  .object({
    organization: z.string().optional(),
    summary: z.string().nullable().optional(),
    actions_details: z.array(actionDetailSchema).optional(),
  })
  .passthrough();

export const ifrcFieldReportSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    event: z.union([z.string(), z.number()]).nullable().optional(),
    title: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
    num_assisted: z.number().nullable().optional(),
    num_affected: z.number().nullable().optional(),
    actions_taken: z.array(actionsTakenSchema).optional(),
  })
  .passthrough();

export const ifrcFieldReportListSchema = z.object({
  count: z.number().optional(),
  results: z.array(ifrcFieldReportSchema),
});

export const ifrcSituationReportSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().optional(),
    created_at: z.string().nullable().optional(),
    document: z.string().nullable().optional(),
    document_url: z.string().nullable().optional(),
    type: z
      .object({
        id: z.union([z.string(), z.number()]).optional(),
        type: z.string().optional(),
        is_primary: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const ifrcSituationReportListSchema = z.object({
  count: z.number().optional(),
  results: z.array(ifrcSituationReportSchema),
});

export type NormalizedIfrcOpsUpdate = {
  externalId: string;
  title: string;
  documentUrl: string | null;
  publishedAt: string | null;
  retrievedAt: string;
};

export type NormalizedIfrcOperation = {
  externalEventId: string;
  externalAppealId: string | null;
  appealCode: string | null;
  appealName: string | null;
  appealStatus: string | null;
  eventName: string | null;
  targetPopulation: number | null;
  peopleReached: number | null;
  amountRequested: number | null;
  amountFunded: number | null;
  currencyCode: string | null;
  activities: string[];
  activitySummary: string | null;
  sourceUrl: string;
  reportedAt: string | null;
  retrievedAt: string;
  opsUpdates: NormalizedIfrcOpsUpdate[];
};

function parseIso(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function asNonNegativeInt(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return Math.trunc(value);
}

function asNonNegativeNumber(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function countryIsColombia(
  countries: z.infer<typeof ifrcEventListItemSchema>["countries"],
): boolean {
  if (!countries?.length) return false;
  return countries.some((country) => {
    if (typeof country === "string") {
      return country.toUpperCase() === "COL" || country.toUpperCase() === "CO";
    }
    return (
      country.iso3?.toUpperCase() === "COL" ||
      Number(country.id) === IFRC_COLOMBIA_COUNTRY_ID
    );
  });
}

function dtypeIsEarthquake(
  dtype: z.infer<typeof ifrcEventListItemSchema>["dtype"],
): boolean {
  if (dtype == null) return false;
  if (typeof dtype === "number") return dtype === IFRC_EARTHQUAKE_DTYPE_ID;
  if (typeof dtype.id === "number" || typeof dtype.id === "string") {
    return Number(dtype.id) === IFRC_EARTHQUAKE_DTYPE_ID;
  }
  return /earthquake/i.test(dtype.name ?? "");
}

/**
 * Pick the best Colombia earthquake event: prefer ones with appeals, then newest start.
 */
export function selectColombiaEarthquakeEvent(
  events: z.infer<typeof ifrcEventListItemSchema>[],
): z.infer<typeof ifrcEventListItemSchema> | null {
  const colombiaQuakes = events.filter(
    (event) => countryIsColombia(event.countries) && dtypeIsEarthquake(event.dtype),
  );
  if (colombiaQuakes.length === 0) return null;

  const ranked = [...colombiaQuakes].sort((a, b) => {
    const aAppeals = a.appeals?.length ?? 0;
    const bAppeals = b.appeals?.length ?? 0;
    if (aAppeals !== bAppeals) return bAppeals - aAppeals;
    const aStart = a.disaster_start_date
      ? Date.parse(a.disaster_start_date)
      : 0;
    const bStart = b.disaster_start_date
      ? Date.parse(b.disaster_start_date)
      : 0;
    const aSafe = Number.isFinite(aStart) ? aStart : 0;
    const bSafe = Number.isFinite(bStart) ? bStart : 0;
    return bSafe - aSafe;
  });

  return ranked[0] ?? null;
}

function extractActivities(
  fieldReports: z.infer<typeof ifrcFieldReportSchema>[],
): { activities: string[]; activitySummary: string | null } {
  const names = new Set<string>();
  let activitySummary: string | null = null;

  for (const report of fieldReports) {
    for (const taken of report.actions_taken ?? []) {
      if (
        !activitySummary &&
        taken.organization === "NTLS" &&
        taken.summary?.trim()
      ) {
        activitySummary = taken.summary.trim();
      }
      for (const detail of taken.actions_details ?? []) {
        const name = detail.name?.trim();
        if (name) names.add(name);
      }
    }
  }

  return {
    activities: [...names],
    activitySummary,
  };
}

/**
 * Prefer the latest field report that reports people assisted (num_assisted).
 * Never invent a value when all reports omit it.
 */
export function pickPeopleReached(
  fieldReports: z.infer<typeof ifrcFieldReportSchema>[],
): number | null {
  const sorted = [...fieldReports].sort((a, b) => {
    const aRaw = a.updated_at ?? a.created_at;
    const bRaw = b.updated_at ?? b.created_at;
    const aAt = aRaw ? Date.parse(aRaw) : 0;
    const bAt = bRaw ? Date.parse(bRaw) : 0;
    const aSafe = Number.isFinite(aAt) ? aAt : 0;
    const bSafe = Number.isFinite(bAt) ? bAt : 0;
    return bSafe - aSafe;
  });

  for (const report of sorted) {
    const assisted = asNonNegativeInt(report.num_assisted);
    if (assisted != null) return assisted;
  }
  return null;
}

function isSituationReport(
  item: z.infer<typeof ifrcSituationReportSchema>,
): boolean {
  const typeName = item.type?.type ?? "";
  return /situation\s*report/i.test(typeName) || /sitrep/i.test(item.name ?? "");
}

export function normalizeIfrcOperation(input: {
  event: z.infer<typeof ifrcEventListItemSchema>;
  fieldReports: z.infer<typeof ifrcFieldReportSchema>[];
  situationReports: z.infer<typeof ifrcSituationReportSchema>[];
  now?: () => Date;
}): NormalizedIfrcOperation {
  const retrievedAt = (input.now ?? (() => new Date()))().toISOString();
  const eventId = String(input.event.id);
  const appeal = input.event.appeals?.[0] ?? null;
  const { activities, activitySummary } = extractActivities(input.fieldReports);

  const opsUpdates: NormalizedIfrcOpsUpdate[] = input.situationReports
    .filter(isSituationReport)
    .map((report) => ({
      externalId: String(report.id),
      title: (report.name?.trim() || `Situation report ${report.id}`).slice(0, 300),
      documentUrl: report.document ?? report.document_url ?? null,
      publishedAt: parseIso(report.created_at),
      retrievedAt,
    }))
    .sort((a, b) => {
      const aAt = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const bAt = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return bAt - aAt;
    });

  return {
    externalEventId: eventId,
    externalAppealId: appeal ? String(appeal.id) : null,
    appealCode: appeal?.code?.trim() || null,
    appealName: appeal?.name?.trim() || null,
    appealStatus: appeal?.status_display?.trim() || null,
    eventName: input.event.name?.trim() || null,
    targetPopulation: asNonNegativeInt(appeal?.num_beneficiaries),
    peopleReached: pickPeopleReached(input.fieldReports),
    amountRequested: asNonNegativeNumber(appeal?.amount_requested),
    amountFunded: asNonNegativeNumber(appeal?.amount_funded),
    // IFRC Emergency Appeals are denominated in CHF.
    currencyCode: appeal ? "CHF" : null,
    activities,
    activitySummary,
    sourceUrl: `https://go.ifrc.org/emergencies/${eventId}`,
    reportedAt:
      parseIso(appeal?.start_date) ??
      parseIso(input.event.updated_at) ??
      parseIso(input.event.disaster_start_date),
    retrievedAt,
    opsUpdates,
  };
}

/**
 * Build a public Help summary from mapped IFRC fields only — no inferred numbers.
 */
export function buildIfrcHelpSummary(
  operation: NormalizedIfrcOperation,
  fallback: string,
): string {
  const parts: string[] = [];
  const formatCount = (n: number) =>
    new Intl.NumberFormat("en-US").format(n);

  if (operation.appealCode && operation.targetPopulation != null) {
    parts.push(
      `Emergency Appeal ${operation.appealCode} targets ${formatCount(operation.targetPopulation)} people.`,
    );
  } else if (operation.appealCode) {
    parts.push(`Emergency Appeal ${operation.appealCode} is active.`);
  }

  if (operation.peopleReached != null) {
    parts.push(
      `${formatCount(operation.peopleReached)} people reached (IFRC field report).`,
    );
  }

  if (operation.activities.length > 0) {
    parts.push(
      `Activities: ${operation.activities.slice(0, 4).join(", ")}.`,
    );
  } else if (operation.activitySummary) {
    parts.push(operation.activitySummary.slice(0, 160));
  }

  if (parts.length === 0) return fallback;
  return parts.join(" ");
}

export type FetchIfrcOptions = {
  countryId?: number;
  eventId?: number | string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

async function fetchJson(
  url: string,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const response = await fetchImpl(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `IFRC request failed (${response.status}) ${url}: ${text.slice(0, 300)}`,
    );
  }
  return response.json();
}

/**
 * Server-only: fetch IFRC GO Colombia earthquake operation + sitreps.
 */
export async function fetchIfrcColombiaEarthquakeOperation(
  options: FetchIfrcOptions = {},
): Promise<NormalizedIfrcOperation | null> {
  const {
    countryId = IFRC_COLOMBIA_COUNTRY_ID,
    eventId: forcedEventId,
    fetchImpl = fetch,
    now = () => new Date(),
  } = options;

  let event: z.infer<typeof ifrcEventListItemSchema> | null = null;

  if (forcedEventId != null) {
    const detail = await fetchJson(
      `${IFRC_API_BASE}/event/${forcedEventId}/`,
      fetchImpl,
    );
    const parsed = ifrcEventListItemSchema.safeParse(detail);
    if (!parsed.success) {
      throw new Error(
        `IFRC event detail failed validation: ${parsed.error.message}`,
      );
    }
    event = parsed.data;
  } else {
    const listUrl = new URL(`${IFRC_API_BASE}/event/`);
    listUrl.searchParams.set("countries__in", String(countryId));
    listUrl.searchParams.set("dtype", String(IFRC_EARTHQUAKE_DTYPE_ID));
    listUrl.searchParams.set("ordering", "-disaster_start_date");
    listUrl.searchParams.set("limit", "20");

    const listJson = await fetchJson(listUrl.toString(), fetchImpl);
    const listParsed = ifrcEventListResponseSchema.safeParse(listJson);
    if (!listParsed.success) {
      throw new Error(
        `IFRC event list failed validation: ${listParsed.error.message}`,
      );
    }
    event = selectColombiaEarthquakeEvent(listParsed.data.results);
  }

  if (!event) return null;

  const eventId = String(event.id);

  // Always load event detail for appeals + field_report stubs.
  // Note: field-report/?event= is unreliable on GO; filter by country + event id.
  const [detailJson, fieldJson, sitrepJson] = await Promise.all([
    fetchJson(`${IFRC_API_BASE}/event/${eventId}/`, fetchImpl),
    fetchJson(
      `${IFRC_API_BASE}/field-report/?countries__in=${countryId}&limit=50&ordering=-created_at`,
      fetchImpl,
    ),
    fetchJson(
      `${IFRC_API_BASE}/situation_report/?event=${encodeURIComponent(eventId)}&limit=20&ordering=-created_at`,
      fetchImpl,
    ),
  ]);

  const detailParsed = ifrcEventListItemSchema.safeParse(detailJson);
  if (detailParsed.success) {
    event = detailParsed.data;
  }

  const fieldParsed = ifrcFieldReportListSchema.safeParse(fieldJson);
  if (!fieldParsed.success) {
    throw new Error(
      `IFRC field reports failed validation: ${fieldParsed.error.message}`,
    );
  }

  const sitrepParsed = ifrcSituationReportListSchema.safeParse(sitrepJson);
  if (!sitrepParsed.success) {
    throw new Error(
      `IFRC situation reports failed validation: ${sitrepParsed.error.message}`,
    );
  }

  const fieldReports = fieldParsed.data.results.filter(
    (report) => String(report.event ?? "") === eventId,
  );

  return normalizeIfrcOperation({
    event,
    fieldReports,
    situationReports: sitrepParsed.data.results,
    now,
  });
}
