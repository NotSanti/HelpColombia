import { createServiceClient } from "@/lib/supabase/admin";
import {
  fetchReliefWebReports,
  type NormalizedReliefWebUpdate,
} from "@/lib/sources/reliefweb";

const RELIEFWEB_SOURCE_NAME = "ReliefWeb";

export type IngestReliefWebResult = {
  ok: true;
  fetched: number;
  upserted: number;
  disasterId: string;
  sourceId: string;
};

export type IngestReliefWebFailure = {
  ok: false;
  stage: "config" | "fetch" | "resolve" | "persist";
  message: string;
};

/**
 * Fetch ReliefWeb reports and upsert into `updates`.
 * On upstream/validation failure, existing rows are left untouched.
 */
export async function ingestReliefWebUpdates(options?: {
  disasterSlug?: string;
  limit?: number;
  fetchImpl?: typeof fetch;
}): Promise<IngestReliefWebResult | IngestReliefWebFailure> {
  const appName = process.env.RELIEFWEB_APP_NAME?.trim();
  if (!appName) {
    return {
      ok: false,
      stage: "config",
      message: "Missing RELIEFWEB_APP_NAME",
    };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      ok: false,
      stage: "config",
      message: "Missing Supabase service-role configuration",
    };
  }

  let reports: NormalizedReliefWebUpdate[];
  try {
    reports = await fetchReliefWebReports({
      appName,
      limit: options?.limit ?? 20,
      fetchImpl: options?.fetchImpl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ReliefWeb fetch failed";
    console.error("[ingestReliefWebUpdates] fetch/validate failed", message);
    return { ok: false, stage: "fetch", message };
  }

  // Empty successful payload: do not wipe existing good rows.
  if (reports.length === 0) {
    return {
      ok: true,
      fetched: 0,
      upserted: 0,
      disasterId: "",
      sourceId: "",
    };
  }

  try {
    const supabase = createServiceClient();
    const disasterSlug =
      options?.disasterSlug ?? "colombia-earthquake-2025-08-17";

    const { data: disaster, error: disasterError } = await supabase
      .from("disaster_events")
      .select("id")
      .eq("slug", disasterSlug)
      .eq("status", "published")
      .maybeSingle();

    if (disasterError || !disaster) {
      return {
        ok: false,
        stage: "resolve",
        message: disasterError?.message ?? `Disaster not found: ${disasterSlug}`,
      };
    }

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select("id")
      .eq("name", RELIEFWEB_SOURCE_NAME)
      .eq("active", true)
      .maybeSingle();

    if (sourceError || !source) {
      return {
        ok: false,
        stage: "resolve",
        message:
          sourceError?.message ??
          `Active source not found: ${RELIEFWEB_SOURCE_NAME}`,
      };
    }

    const rows = reports.map((report) => ({
      disaster_id: disaster.id,
      source_id: source.id,
      external_id: report.externalId,
      title: report.title,
      summary: report.summary,
      source_url: report.sourceUrl,
      accent: report.accent,
      published_at: report.publishedAt,
      retrieved_at: report.retrievedAt,
    }));

    const { data: upserted, error: upsertError } = await supabase
      .from("updates")
      .upsert(rows, { onConflict: "source_id,external_id" })
      .select("id");

    if (upsertError) {
      console.error("[ingestReliefWebUpdates] persist failed", upsertError);
      return {
        ok: false,
        stage: "persist",
        message: upsertError.message,
      };
    }

    return {
      ok: true,
      fetched: reports.length,
      upserted: upserted?.length ?? rows.length,
      disasterId: disaster.id,
      sourceId: source.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected persist failure";
    console.error("[ingestReliefWebUpdates] unexpected", message);
    return { ok: false, stage: "persist", message };
  }
}
