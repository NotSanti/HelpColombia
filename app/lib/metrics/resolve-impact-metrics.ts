import { sourcePriorityScore } from "@/lib/metrics/source-priority";
import type { Database } from "@/types/database";

export type MetricType = Database["public"]["Enums"]["metric_type"];

export type ImpactMetricObservation = {
  id: string;
  metricType: MetricType | string;
  value: number;
  unit: string;
  displayValue: string | null;
  detail: string | null;
  /** null/empty = national / overall */
  department: string | null;
  municipality: string | null;
  sourceId: string | null;
  sourceName: string | null;
  trustTier: string | null;
  sourceUrl: string | null;
  reportedAt: string | null;
  retrievedAt: string;
};

export type ResolvedImpactMetric = {
  metricType: string;
  value: number;
  displayValue: string;
  detail: string | null;
  department: string | null;
  provenance: {
    sourceName: string;
    trustTier: string | null;
    sourceUrl: string | null;
    reportedAt: string | null;
    retrievedAt: string;
    observationId: string;
  };
  /** Other observations considered but not selected (never averaged). */
  alternatives: Array<{
    observationId: string;
    sourceName: string;
    value: number;
    displayValue: string;
    reportedAt: string | null;
  }>;
};

function formatDisplayValue(value: number, displayValue: string | null): string {
  if (displayValue?.trim()) return displayValue.trim();
  return new Intl.NumberFormat("en-US").format(value);
}

function geographyKey(department: string | null | undefined): string {
  const trimmed = department?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.toLowerCase() : "__national__";
}

function timestampMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function compareObservations(
  a: ImpactMetricObservation,
  b: ImpactMetricObservation,
): number {
  const priorityDiff =
    sourcePriorityScore({
      trustTier: b.trustTier,
      sourceName: b.sourceName,
    }) -
    sourcePriorityScore({
      trustTier: a.trustTier,
      sourceName: a.sourceName,
    });
  if (priorityDiff !== 0) return priorityDiff;

  const reportedDiff = timestampMs(b.reportedAt) - timestampMs(a.reportedAt);
  if (reportedDiff !== 0) return reportedDiff;

  return timestampMs(b.retrievedAt) - timestampMs(a.retrievedAt);
}

/**
 * Resolve the single display metric for a type + geography.
 * Never averages conflicting values — picks by trust, then recency.
 */
export function resolveImpactMetric(input: {
  observations: ImpactMetricObservation[];
  metricType: string;
  /** null = national */
  department?: string | null;
}): ResolvedImpactMetric | null {
  const geo = geographyKey(input.department ?? null);
  const candidates = input.observations.filter(
    (row) =>
      row.metricType === input.metricType &&
      geographyKey(row.department) === geo,
  );

  if (candidates.length === 0) return null;

  const ranked = [...candidates].sort(compareObservations);
  const winner = ranked[0];
  const alternatives = ranked.slice(1).map((row) => ({
    observationId: row.id,
    sourceName: row.sourceName ?? "Unknown source",
    value: row.value,
    displayValue: formatDisplayValue(row.value, row.displayValue),
    reportedAt: row.reportedAt,
  }));

  return {
    metricType: winner.metricType,
    value: winner.value,
    displayValue: formatDisplayValue(winner.value, winner.displayValue),
    detail: winner.detail,
    department: winner.department,
    provenance: {
      sourceName: winner.sourceName ?? "Unknown source",
      trustTier: winner.trustTier,
      sourceUrl: winner.sourceUrl,
      reportedAt: winner.reportedAt,
      retrievedAt: winner.retrievedAt,
      observationId: winner.id,
    },
    alternatives,
  };
}

export function resolveNationalKeyFigures(
  observations: ImpactMetricObservation[],
  metricTypes: readonly string[] = [
    "deaths",
    "injured",
    "affected",
    "displaced",
    // Fallback 4th slot when displaced is not yet reported.
    "aftershocks",
  ],
  maxFigures = 4,
): ResolvedImpactMetric[] {
  return metricTypes
    .map((metricType) =>
      resolveImpactMetric({ observations, metricType, department: null }),
    )
    .filter((row): row is ResolvedImpactMetric => Boolean(row))
    .slice(0, maxFigures);
}

export function resolveRegionalMetric(input: {
  observations: ImpactMetricObservation[];
  metricType: string;
  departmentName: string;
}): ResolvedImpactMetric | null {
  return resolveImpactMetric({
    observations: input.observations,
    metricType: input.metricType,
    department: input.departmentName,
  });
}
