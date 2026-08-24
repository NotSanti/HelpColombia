import { createServiceClient } from "@/lib/supabase/admin";

export type SourceStatusRow = {
  id: string;
  name: string;
  sourceType: string;
  active: boolean;
  latestUpdateAt: string | null;
  latestMetricAt: string | null;
};

export type AdminOverview = {
  disasterUpdatedAt: string | null;
  donationHealth: {
    totalVerified: number;
    needsReview: number;
    unhealthy: number;
    lastCheckedAt: string | null;
  };
  sources: SourceStatusRow[];
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = createServiceClient();

  const [
    disasterResult,
    sourcesResult,
    updatesResult,
    metricsResult,
    donationsResult,
  ] = await Promise.all([
    supabase
      .from("disaster_events")
      .select("updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("sources")
      .select("id, name, source_type, active")
      .order("name", { ascending: true }),
    supabase
      .from("updates")
      .select("source_id, retrieved_at")
      .order("retrieved_at", { ascending: false }),
    supabase
      .from("impact_metrics")
      .select("source_id, retrieved_at")
      .order("retrieved_at", { ascending: false }),
    supabase
      .from("donation_destinations")
      .select(
        "health_status, needs_review, last_checked_at, verification_status",
      )
      .eq("verification_status", "verified"),
  ]);

  if (sourcesResult.error) {
    throw new Error(sourcesResult.error.message);
  }

  const latestUpdateBySource = new Map<string, string>();
  for (const row of updatesResult.data ?? []) {
    if (!row.source_id || latestUpdateBySource.has(row.source_id)) continue;
    latestUpdateBySource.set(row.source_id, row.retrieved_at);
  }

  const latestMetricBySource = new Map<string, string>();
  for (const row of metricsResult.data ?? []) {
    if (!row.source_id || latestMetricBySource.has(row.source_id)) continue;
    latestMetricBySource.set(row.source_id, row.retrieved_at);
  }

  const verified = donationsResult.data ?? [];
  let needsReview = 0;
  let unhealthy = 0;
  let lastCheckedAt: string | null = null;

  for (const row of verified) {
    if (row.needs_review) needsReview += 1;
    if (row.health_status === "unhealthy") unhealthy += 1;
    if (
      row.last_checked_at &&
      (!lastCheckedAt || row.last_checked_at > lastCheckedAt)
    ) {
      lastCheckedAt = row.last_checked_at;
    }
  }

  return {
    disasterUpdatedAt: disasterResult.data?.updated_at ?? null,
    donationHealth: {
      totalVerified: verified.length,
      needsReview,
      unhealthy,
      lastCheckedAt,
    },
    sources: (sourcesResult.data ?? []).map((source) => ({
      id: source.id,
      name: source.name,
      sourceType: source.source_type,
      active: source.active,
      latestUpdateAt: latestUpdateBySource.get(source.id) ?? null,
      latestMetricAt: latestMetricBySource.get(source.id) ?? null,
    })),
  };
}
