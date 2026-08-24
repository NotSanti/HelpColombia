import { createServiceClient } from "@/lib/supabase/admin";
import {
  buildIfrcHelpSummary,
  fetchIfrcColombiaEarthquakeOperation,
  type NormalizedIfrcOperation,
} from "@/lib/sources/ifrc";

export type IngestIfrcResult = {
  ok: true;
  disasterId: string;
  externalEventId: string;
  appealCode: string | null;
  targetPopulation: number | null;
  peopleReached: number | null;
  opsUpdatesUpserted: number;
  helpSummary: string;
};

export type IngestIfrcFailure = {
  ok: false;
  stage: "config" | "fetch" | "resolve" | "persist";
  message: string;
};

const RED_CROSS_SLUG = "colombian-red-cross";

/**
 * Fetch IFRC GO Colombia earthquake ops and upsert into ifrc_* tables.
 * Does not overwrite organizations.short_description — public copy is derived at read time.
 */
export async function ingestIfrcOperations(options?: {
  disasterSlug?: string;
  eventId?: number | string;
  fetchImpl?: typeof fetch;
}): Promise<IngestIfrcResult | IngestIfrcFailure> {
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

  const eventId = options?.eventId ?? process.env.IFRC_EVENT_ID;

  let operation: NormalizedIfrcOperation | null;
  try {
    operation = await fetchIfrcColombiaEarthquakeOperation({
      eventId: eventId || undefined,
      fetchImpl: options?.fetchImpl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IFRC fetch failed";
    console.error("[ingestIfrcOperations] fetch/validate failed", message);
    return { ok: false, stage: "fetch", message };
  }

  if (!operation) {
    return {
      ok: false,
      stage: "fetch",
      message: "No Colombia earthquake IFRC event found",
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

    const { data: organization } = await supabase
      .from("organizations")
      .select("id, short_description")
      .eq("slug", RED_CROSS_SLUG)
      .maybeSingle();

    await supabase.from("sources").upsert(
      {
        name: "IFRC GO",
        source_type: "agency",
        base_url: "https://go.ifrc.org/",
        trust_tier: "humanitarian",
        active: true,
      },
      { onConflict: "name" },
    );

    const { data: upsertedOp, error: opError } = await supabase
      .from("ifrc_operations")
      .upsert(
        {
          disaster_id: disaster.id,
          organization_id: organization?.id ?? null,
          external_event_id: operation.externalEventId,
          external_appeal_id: operation.externalAppealId,
          appeal_code: operation.appealCode,
          appeal_name: operation.appealName,
          appeal_status: operation.appealStatus,
          event_name: operation.eventName,
          target_population: operation.targetPopulation,
          people_reached: operation.peopleReached,
          amount_requested: operation.amountRequested,
          amount_funded: operation.amountFunded,
          currency_code: operation.currencyCode,
          activities: operation.activities,
          activity_summary: operation.activitySummary,
          source_url: operation.sourceUrl,
          reported_at: operation.reportedAt,
          retrieved_at: operation.retrievedAt,
        },
        { onConflict: "disaster_id,external_event_id" },
      )
      .select("id")
      .single();

    if (opError || !upsertedOp) {
      console.error("[ingestIfrcOperations] persist operation failed", opError);
      return {
        ok: false,
        stage: "persist",
        message: opError?.message ?? "Failed to upsert ifrc_operations",
      };
    }

    let opsUpdatesUpserted = 0;
    if (operation.opsUpdates.length > 0) {
      const rows = operation.opsUpdates.map((update) => ({
        disaster_id: disaster.id,
        operation_id: upsertedOp.id,
        external_id: update.externalId,
        title: update.title,
        document_url: update.documentUrl,
        published_at: update.publishedAt,
        retrieved_at: update.retrievedAt,
      }));

      const { data, error } = await supabase
        .from("ifrc_ops_updates")
        .upsert(rows, { onConflict: "disaster_id,external_id" })
        .select("id");

      if (error) {
        console.error("[ingestIfrcOperations] persist updates failed", error);
        return { ok: false, stage: "persist", message: error.message };
      }
      opsUpdatesUpserted = data?.length ?? rows.length;
    }

    const helpSummary = buildIfrcHelpSummary(
      operation,
      organization?.short_description ??
        "Local teams on the ground providing emergency relief.",
    );

    return {
      ok: true,
      disasterId: disaster.id,
      externalEventId: operation.externalEventId,
      appealCode: operation.appealCode,
      targetPopulation: operation.targetPopulation,
      peopleReached: operation.peopleReached,
      opsUpdatesUpserted,
      helpSummary,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected persist failure";
    console.error("[ingestIfrcOperations] unexpected", message);
    return { ok: false, stage: "persist", message };
  }
}
