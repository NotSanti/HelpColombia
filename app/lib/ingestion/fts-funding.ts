import { createServiceClient } from "@/lib/supabase/admin";
import {
  fetchFtsFundingFlows,
  type NormalizedFundingFlow,
} from "@/lib/sources/fts";

export type IngestFundingResult = {
  ok: true;
  disasterId: string;
  upserted: number;
  year: number;
};

export type IngestFundingFailure = {
  ok: false;
  stage: "config" | "fetch" | "resolve" | "persist";
  message: string;
};

/**
 * Fetch OCHA FTS flows and upsert into funding_flows.
 * Upstream failure leaves existing rows untouched.
 */
export async function ingestFtsFunding(options?: {
  disasterSlug?: string;
  countryIso3?: string;
  year?: number;
  fetchImpl?: typeof fetch;
}): Promise<IngestFundingResult | IngestFundingFailure> {
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

  const year = options?.year ?? new Date().getUTCFullYear();
  const countryIso3 = options?.countryIso3 ?? "COL";

  let flows: NormalizedFundingFlow[];
  try {
    flows = await fetchFtsFundingFlows({
      countryIso3,
      year,
      fetchImpl: options?.fetchImpl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FTS fetch failed";
    console.error("[ingestFtsFunding] fetch/validate failed", message);
    return { ok: false, stage: "fetch", message };
  }

  if (flows.length === 0) {
    return {
      ok: true,
      disasterId: "",
      upserted: 0,
      year,
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
        message:
          disasterError?.message ?? `Disaster not found: ${disasterSlug}`,
      };
    }

    await supabase.from("sources").upsert(
      {
        name: "OCHA FTS",
        source_type: "agency",
        base_url: "https://fts.unocha.org/",
        trust_tier: "official",
        active: true,
      },
      { onConflict: "name" },
    );

    const rows = flows.map((flow) => ({
      disaster_id: disaster.id,
      external_id: flow.externalId,
      donor: flow.donor,
      recipient: flow.recipient,
      amount_usd: flow.amountUsd,
      status: flow.status,
      upstream_status: flow.upstreamStatus,
      sector: flow.sector,
      source_url: flow.sourceUrl,
      reported_at: flow.reportedAt,
      retrieved_at: flow.retrievedAt,
    }));

    // Upsert in chunks to avoid oversized payloads.
    const chunkSize = 200;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from("funding_flows")
        .upsert(chunk, { onConflict: "disaster_id,external_id" })
        .select("id");
      if (error) {
        console.error("[ingestFtsFunding] persist failed", error);
        return { ok: false, stage: "persist", message: error.message };
      }
      upserted += data?.length ?? chunk.length;
    }

    return {
      ok: true,
      disasterId: disaster.id,
      upserted,
      year,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected persist failure";
    console.error("[ingestFtsFunding] unexpected", message);
    return { ok: false, stage: "persist", message };
  }
}
