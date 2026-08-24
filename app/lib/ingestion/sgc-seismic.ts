import { createServiceClient } from "@/lib/supabase/admin";
import {
  fetchSgcSeismicSnapshot,
  type NormalizedSeismicSnapshot,
} from "@/lib/sources/sgc";

const SGC_SOURCE_NAME = "SGC";

export type IngestSeismicResult = {
  ok: true;
  disasterId: string;
  primaryEventId: string;
  magnitude: number;
  aftershockCount: number;
};

export type IngestSeismicFailure = {
  ok: false;
  stage: "config" | "fetch" | "resolve" | "persist";
  message: string;
};

/**
 * Fetch SGC seismic feed and update the published disaster_events row.
 * Malformed/upstream failures leave existing disaster metadata untouched.
 */
export async function ingestSgcSeismic(options?: {
  disasterSlug?: string;
  fetchImpl?: typeof fetch;
  primaryEventId?: string;
}): Promise<IngestSeismicResult | IngestSeismicFailure> {
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

  let snapshot: NormalizedSeismicSnapshot;
  try {
    snapshot = await fetchSgcSeismicSnapshot({
      fetchImpl: options?.fetchImpl,
      primaryEventId:
        options?.primaryEventId ?? process.env.SEISMIC_PRIMARY_EVENT_ID,
      minPrimaryMagnitude: process.env.SEISMIC_MIN_MAGNITUDE
        ? Number(process.env.SEISMIC_MIN_MAGNITUDE)
        : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SGC fetch failed";
    console.error("[ingestSgcSeismic] fetch/validate failed", message);
    return { ok: false, stage: "fetch", message };
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

    // Ensure SGC appears in active sources (for footer attribution).
    await supabase.from("sources").upsert(
      {
        name: SGC_SOURCE_NAME,
        source_type: "agency",
        base_url: "https://www.sgc.gov.co/sismos",
        trust_tier: "official",
        active: true,
      },
      { onConflict: "name" },
    );

    const { primary, aftershocksLabel, epicenterLabel, aftershockCount } =
      snapshot;

    const { error: updateError } = await supabase
      .from("disaster_events")
      .update({
        magnitude: primary.magnitude,
        latitude: primary.latitude,
        longitude: primary.longitude,
        depth_km: primary.depthKm,
        epicenter_label: epicenterLabel,
        aftershocks_label: aftershocksLabel,
        occurred_at: primary.occurredAtUtc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", disaster.id)
      .eq("status", "published");

    if (updateError) {
      console.error("[ingestSgcSeismic] persist failed", updateError);
      return { ok: false, stage: "persist", message: updateError.message };
    }

    return {
      ok: true,
      disasterId: disaster.id,
      primaryEventId: primary.externalId,
      magnitude: primary.magnitude,
      aftershockCount,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected persist failure";
    console.error("[ingestSgcSeismic] unexpected", message);
    return { ok: false, stage: "persist", message };
  }
}
