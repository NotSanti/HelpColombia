import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";

const metricTypeSchema = z.enum([
  "deaths",
  "injured",
  "affected",
  "displaced",
  "aftershocks",
]);

export const ungrdMetricsImportSchema = z.object({
  disasterSlug: z.string().min(1).default("colombia-earthquake-2025-08-17"),
  sourceName: z.string().min(1).default("UNGRD"),
  sourceUrl: z.string().url().optional(),
  reportedAt: z.string().datetime({ offset: true }).optional(),
  metrics: z
    .array(
      z.object({
        metricType: metricTypeSchema,
        value: z.number().finite().nonnegative(),
        displayValue: z.string().min(1).optional(),
        detail: z.string().optional(),
        department: z.string().min(1).nullable().optional(),
        municipality: z.string().min(1).nullable().optional(),
        unit: z.string().min(1).default("count"),
      }),
    )
    .min(1),
});

export type UngrdMetricsImport = z.infer<typeof ungrdMetricsImportSchema>;

export type ImportMetricsResult =
  | { ok: true; inserted: number; disasterId: string; sourceId: string }
  | { ok: false; stage: "config" | "validate" | "resolve" | "persist"; message: string };

/**
 * Append-only import of structured official metrics (UNGRD or similar).
 * Does not scrape and never updates/deletes prior observations.
 */
export async function importStructuredImpactMetrics(
  raw: unknown,
): Promise<ImportMetricsResult> {
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

  const parsed = ungrdMetricsImportSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      stage: "validate",
      message: parsed.error.message,
    };
  }

  const payload = parsed.data;
  const retrievedAt = new Date().toISOString();
  const reportedAt = payload.reportedAt ?? retrievedAt;

  try {
    const supabase = createServiceClient();

    const { data: disaster, error: disasterError } = await supabase
      .from("disaster_events")
      .select("id")
      .eq("slug", payload.disasterSlug)
      .eq("status", "published")
      .maybeSingle();

    if (disasterError || !disaster) {
      return {
        ok: false,
        stage: "resolve",
        message:
          disasterError?.message ?? `Disaster not found: ${payload.disasterSlug}`,
      };
    }

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .upsert(
        {
          name: payload.sourceName,
          source_type: "agency",
          base_url: payload.sourceUrl ?? null,
          trust_tier: "official",
          active: true,
        },
        { onConflict: "name" },
      )
      .select("id")
      .maybeSingle();

    if (sourceError || !source) {
      return {
        ok: false,
        stage: "resolve",
        message: sourceError?.message ?? `Source upsert failed: ${payload.sourceName}`,
      };
    }

    const rows = payload.metrics.map((metric) => ({
      disaster_id: disaster.id,
      metric_type: metric.metricType,
      value: metric.value,
      unit: metric.unit,
      display_value: metric.displayValue ?? null,
      detail: metric.detail ?? null,
      department: metric.department ?? null,
      municipality: metric.municipality ?? null,
      source_id: source.id,
      source_url: payload.sourceUrl ?? null,
      reported_at: reportedAt,
      retrieved_at: retrievedAt,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("impact_metrics")
      .insert(rows)
      .select("id");

    if (insertError) {
      return { ok: false, stage: "persist", message: insertError.message };
    }

    return {
      ok: true,
      inserted: inserted?.length ?? rows.length,
      disasterId: disaster.id,
      sourceId: source.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected import failure";
    return { ok: false, stage: "persist", message };
  }
}
