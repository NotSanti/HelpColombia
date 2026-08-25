import { dashboardFixture } from "@/lib/fixtures/dashboard";
import {
  createClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  resolveNationalKeyFigures,
  resolveRegionalMetric,
  type ImpactMetricObservation,
} from "@/lib/metrics/resolve-impact-metrics";
import { aggregateFundingFlows } from "@/lib/funding/aggregate";
import type { NormalizedFundingFlow } from "@/lib/sources/fts";
import {
  buildIfrcHelpSummary,
  type NormalizedIfrcOperation,
} from "@/lib/sources/ifrc";
import type {
  DashboardData,
  KeyFigure,
  LiveUpdateItem,
  OrganizationHelp,
  OrganizationHelpMetric,
  RegionImpact,
  Severity,
} from "@/types/dashboard";

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Recently";
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Recently";

  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatOccurredDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

function formatOccurredTime(iso: string): string {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Bogota",
  }).format(new Date(iso));
  return `${time} (Local time)`;
}

function formatPublishedLabel(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

function asAccent(
  value: string | null | undefined,
): "severe" | "info" | "high" {
  if (value === "severe" || value === "high" || value === "info") return value;
  return "info";
}

function asUpdateAccent(
  value: string | null | undefined,
): LiveUpdateItem["accent"] {
  if (value === "severe" || value === "high" || value === "info") return value;
  return "info";
}

function asFigureTone(metricType: string): KeyFigure["tone"] {
  switch (metricType) {
    case "deaths":
      return "severe";
    case "injured":
      return "info";
    case "affected":
      return "high";
    case "displaced":
      return "low";
    default:
      return "info";
  }
}

function formatMetricLabel(metricType: string): string {
  switch (metricType) {
    case "deaths":
      return "Deaths";
    case "injured":
      return "Injured";
    case "affected":
      return "People affected";
    case "displaced":
      return "Displaced";
    default:
      return metricType;
  }
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function buildOrganizationHelpFromIfrc(input: {
  operation: NormalizedIfrcOperation | null;
  latestOpsUpdateTitle: string | null;
  latestOpsUpdateAt: string | null;
}): {
  summary: string;
  metrics: OrganizationHelpMetric[];
  opsUpdateLabel?: string;
} | null {
  if (!input.operation) return null;

  const metrics: OrganizationHelpMetric[] = [];
  if (input.operation.targetPopulation != null) {
    metrics.push({
      label: "Target population",
      value: formatCount(input.operation.targetPopulation),
      sourceName: "IFRC GO",
    });
  }
  if (input.operation.peopleReached != null) {
    metrics.push({
      label: "People reached",
      value: formatCount(input.operation.peopleReached),
      sourceName: "IFRC GO",
    });
  }

  const opsUpdateLabel = input.latestOpsUpdateTitle
    ? `${input.latestOpsUpdateTitle.slice(0, 72)}${
        input.latestOpsUpdateAt
          ? ` · ${formatRelativeTime(input.latestOpsUpdateAt)}`
          : ""
      }`
    : undefined;

  return {
    summary: buildIfrcHelpSummary(input.operation, ""),
    metrics,
    opsUpdateLabel,
  };
}

async function loadDashboardFromSupabase(): Promise<DashboardData> {
  const supabase = await createClient();

  const { data: disaster, error: disasterError } = await supabase
    .from("disaster_events")
    .select("*")
    .eq("status", "published")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (disasterError) throw disasterError;
  if (!disaster) {
    throw new Error("No published disaster_events row found");
  }

  const [
    { data: metrics, error: metricsError },
    { data: regions, error: regionsError },
    { data: organizations, error: organizationsError },
    { data: updates, error: updatesError },
    { data: sources, error: sourcesError },
    { data: fundingRows, error: fundingError },
    { data: ifrcOps, error: ifrcOpsError },
    { data: ifrcUpdates, error: ifrcUpdatesError },
  ] = await Promise.all([
    supabase
      .from("impact_metrics")
      .select("*")
      .eq("disaster_id", disaster.id)
      .order("retrieved_at", { ascending: false }),
    supabase
      .from("regions")
      .select("*")
      .eq("disaster_id", disaster.id)
      .order("name", { ascending: true }),
    supabase
      .from("organizations")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("updates")
      .select("*")
      .eq("disaster_id", disaster.id)
      .order("published_at", { ascending: false })
      .limit(40),
    supabase
      .from("sources")
      .select("id, name, trust_tier")
      .eq("active", true)
      .order("name"),
    supabase
      .from("funding_flows")
      .select("*")
      .eq("disaster_id", disaster.id),
    supabase
      .from("ifrc_operations")
      .select("*")
      .eq("disaster_id", disaster.id)
      .order("retrieved_at", { ascending: false })
      .limit(1),
    supabase
      .from("ifrc_ops_updates")
      .select("*")
      .eq("disaster_id", disaster.id)
      .order("published_at", { ascending: false })
      .limit(1),
  ]);

  if (metricsError) throw metricsError;
  if (regionsError) throw regionsError;
  if (organizationsError) throw organizationsError;
  if (updatesError) throw updatesError;
  if (sourcesError) throw sourcesError;
  if (fundingError) throw fundingError;
  if (ifrcOpsError) throw ifrcOpsError;
  if (ifrcUpdatesError) throw ifrcUpdatesError;

  const ifrcOpRow = ifrcOps?.[0] ?? null;
  const ifrcUpdateRow = ifrcUpdates?.[0] ?? null;

  const sourceById = new Map(
    (sources ?? []).map((source) => [source.id, source]),
  );

  const observations: ImpactMetricObservation[] = (metrics ?? []).map(
    (row) => {
      const source = row.source_id ? sourceById.get(row.source_id) : undefined;
      return {
        id: row.id,
        metricType: row.metric_type,
        value: Number(row.value),
        unit: row.unit,
        displayValue: row.display_value,
        detail: row.detail,
        department: row.department,
        municipality: row.municipality,
        sourceId: row.source_id,
        sourceName: source?.name ?? null,
        trustTier: source?.trust_tier ?? null,
        sourceUrl: row.source_url,
        reportedAt: row.reported_at,
        retrievedAt: row.retrieved_at,
      };
    },
  );

  const resolvedFigures = resolveNationalKeyFigures(observations);
  const keyFigures: KeyFigure[] = resolvedFigures.map((resolved) => ({
    id: resolved.metricType,
    label: formatMetricLabel(resolved.metricType),
    detail: resolved.detail ?? undefined,
    value: resolved.displayValue,
    tone: asFigureTone(resolved.metricType),
    sourceName: resolved.provenance.sourceName,
    reportedAtLabel: formatRelativeTime(
      resolved.provenance.reportedAt ?? resolved.provenance.retrievedAt,
    ),
  }));

  const ifrcHelp = buildOrganizationHelpFromIfrc({
    operation: ifrcOpRow
      ? {
          externalEventId: ifrcOpRow.external_event_id,
          externalAppealId: ifrcOpRow.external_appeal_id,
          appealCode: ifrcOpRow.appeal_code,
          appealName: ifrcOpRow.appeal_name,
          appealStatus: ifrcOpRow.appeal_status,
          eventName: ifrcOpRow.event_name,
          targetPopulation: ifrcOpRow.target_population,
          peopleReached: ifrcOpRow.people_reached,
          amountRequested:
            ifrcOpRow.amount_requested != null
              ? Number(ifrcOpRow.amount_requested)
              : null,
          amountFunded:
            ifrcOpRow.amount_funded != null
              ? Number(ifrcOpRow.amount_funded)
              : null,
          currencyCode: ifrcOpRow.currency_code,
          activities: ifrcOpRow.activities ?? [],
          activitySummary: ifrcOpRow.activity_summary,
          sourceUrl: ifrcOpRow.source_url,
          reportedAt: ifrcOpRow.reported_at,
          retrievedAt: ifrcOpRow.retrieved_at,
          opsUpdates: [],
        }
      : null,
    latestOpsUpdateTitle: ifrcUpdateRow?.title ?? null,
    latestOpsUpdateAt: ifrcUpdateRow?.published_at ?? null,
  });

  const organizationRows: OrganizationHelp[] = (organizations ?? []).map(
    (org) => {
      const base: OrganizationHelp = {
        id: org.slug,
        slug: org.slug,
        name: org.name,
        summary: org.short_description ?? "",
        websiteUrl: org.website_url ?? "#",
        websiteLabel: "Official site",
        accent: asAccent(org.accent),
      };

      if (org.slug === "colombian-red-cross" && ifrcHelp) {
        return {
          ...base,
          summary: ifrcHelp.summary || base.summary,
          metrics: ifrcHelp.metrics,
          opsUpdateLabel: ifrcHelp.opsUpdateLabel,
        };
      }

      return base;
    },
  );

  const regionRows: RegionImpact[] = (regions ?? []).map((region) => {
    const deathsResolved = resolveRegionalMetric({
      observations,
      metricType: "deaths",
      departmentName: region.name,
    });
    const affectedResolved = resolveRegionalMetric({
      observations,
      metricType: "affected",
      departmentName: region.name,
    });
    const injuredResolved = resolveRegionalMetric({
      observations,
      metricType: "injured",
      departmentName: region.name,
    });
    const displacedResolved = resolveRegionalMetric({
      observations,
      metricType: "displaced",
      departmentName: region.name,
    });

    const formatRegionCount = (
      resolved: ReturnType<typeof resolveRegionalMetric>,
      display: string | null | undefined,
      raw: number | null | undefined,
    ): string | null => {
      if (resolved?.displayValue) return resolved.displayValue;
      if (display?.trim()) return display.trim();
      if (raw != null) return new Intl.NumberFormat("en-US").format(raw);
      return null;
    };

    const deaths =
      formatRegionCount(
        deathsResolved,
        region.deaths_display,
        region.deaths,
      ) ?? "—";
    const affected =
      formatRegionCount(
        affectedResolved,
        region.affected_display,
        region.affected_count,
      ) ?? "—";
    const injured = formatRegionCount(
      injuredResolved,
      null,
      region.injured,
    );
    const displaced = formatRegionCount(
      displacedResolved,
      null,
      region.displaced,
    );

    const sourceNames = [
      ...new Set(
        [
          deathsResolved?.provenance.sourceName,
          affectedResolved?.provenance.sourceName,
          injuredResolved?.provenance.sourceName,
          displacedResolved?.provenance.sourceName,
        ].filter((name): name is string => Boolean(name)),
      ),
    ];

    const lastUpdatedIso = [
      deathsResolved?.provenance.reportedAt ??
        deathsResolved?.provenance.retrievedAt,
      affectedResolved?.provenance.reportedAt ??
        affectedResolved?.provenance.retrievedAt,
      injuredResolved?.provenance.reportedAt ??
        injuredResolved?.provenance.retrievedAt,
      displacedResolved?.provenance.reportedAt ??
        displacedResolved?.provenance.retrievedAt,
      region.updated_at,
    ]
      .filter((iso): iso is string => Boolean(iso))
      .sort()
      .at(-1);

    return {
      id: region.id,
      name: region.name,
      severity: region.severity as Severity,
      deaths,
      affected,
      injured,
      displaced,
      sourceName: sourceNames[0],
      sourceNames,
      lastUpdatedLabel: lastUpdatedIso
        ? formatRelativeTime(lastUpdatedIso)
        : null,
    };
  });

  const severityRank: Record<Severity, number> = {
    severe: 0,
    high: 1,
    moderate: 2,
    low: 3,
  };
  regionRows.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );

  const fundingFlows: NormalizedFundingFlow[] = (fundingRows ?? []).map(
    (row) => ({
      externalId: row.external_id,
      donor: row.donor,
      recipient: row.recipient,
      amountUsd: Number(row.amount_usd),
      status: row.status,
      upstreamStatus: row.upstream_status,
      sector: row.sector,
      sourceUrl: row.source_url ?? "",
      reportedAt: row.reported_at,
      retrievedAt: row.retrieved_at,
    }),
  );
  const funding = aggregateFundingFlows(fundingFlows);

  const liveUpdates: LiveUpdateItem[] = (updates ?? []).map((row) => ({
    id: row.id,
    source:
      (row.source_id ? sourceById.get(row.source_id)?.name : undefined) ??
      "Update",
    title: row.title,
    relativeTime: formatRelativeTime(row.published_at ?? row.retrieved_at),
    accent: asUpdateAccent(row.accent),
    summary: row.summary,
    sourceUrl: row.source_url,
    publishedAtLabel: formatPublishedLabel(row.published_at ?? row.retrieved_at),
    retrievedAt: row.retrieved_at,
  }));

  const freshestMetricAt = resolvedFigures
    .map(
      (figure) =>
        figure.provenance.reportedAt ?? figure.provenance.retrievedAt,
    )
    .filter(Boolean)
    .sort()
    .at(-1);

  const latestUpdateAt =
    updates?.[0]?.published_at ??
    updates?.[0]?.retrieved_at ??
    freshestMetricAt ??
    disaster.updated_at;

  return {
    dataMode: "live",
    liveStatus: {
      headline: disaster.headline ?? disaster.name,
      summary: disaster.summary ?? "",
      lastUpdatedLabel: formatRelativeTime(latestUpdateAt),
      isLive: true,
    },
    earthquake: {
      magnitude: Number(disaster.magnitude ?? 0),
      occurredAtLabel: formatOccurredDate(disaster.occurred_at),
      timeLabel: formatOccurredTime(disaster.occurred_at),
      epicenter: disaster.epicenter_label ?? "Epicenter pending",
      depthKm: Number(disaster.depth_km ?? 0),
      aftershocksLabel:
        disaster.aftershocks_label ?? "Aftershock count pending",
      latitude: disaster.latitude,
      longitude: disaster.longitude,
    },
    keyFigures:
      keyFigures.length > 0 ? keyFigures : dashboardFixture.keyFigures,
    organizations:
      organizationRows.length > 0
        ? organizationRows
        : dashboardFixture.organizations,
    fundingTotals:
      fundingFlows.length > 0
        ? funding.totals
        : dashboardFixture.fundingTotals,
    sectors:
      fundingFlows.length > 0 ? funding.sectors : dashboardFixture.sectors,
    liveUpdates:
      liveUpdates.length > 0 ? liveUpdates : dashboardFixture.liveUpdates,
    regions: regionRows.length > 0 ? regionRows : dashboardFixture.regions,
    dataSources:
      (sources ?? []).length > 0
        ? (sources ?? []).map((s) => s.name)
        : dashboardFixture.dataSources,
  };
}

/**
 * Load dashboard data from Supabase when configured.
 * Falls back to the static fixture so local builds work without env/Docker.
 */
export async function getDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured()) {
    return dashboardFixture;
  }

  try {
    return await loadDashboardFromSupabase();
  } catch (error) {
    console.error(
      "[getDashboardData] Supabase read failed; using fixture",
      error,
    );
    return { ...dashboardFixture, dataMode: "degraded" };
  }
}
