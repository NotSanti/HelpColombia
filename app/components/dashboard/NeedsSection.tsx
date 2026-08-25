"use client";

import type { RegionImpact } from "@/types/dashboard";
import { SeverityBadge } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="metric-value mt-0.5 text-sm font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function NeedsSection({
  regions,
  selectedRegionId,
  onSelectRegion,
  className,
}: {
  regions: RegionImpact[];
  selectedRegionId?: string | null;
  onSelectRegion?: (regionId: string) => void;
  className?: string;
}) {
  return (
    <section
      id="needs"
      aria-labelledby="needs-heading"
      className={cn(
        "scroll-mt-section border-t border-border/50 bg-background px-4 py-12 sm:px-6 md:py-16",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="needs-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Who Needs Help
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Where humanitarian needs are greatest right now, ordered by severity.
          Select a region to highlight it on the overview map. Missing figures
          are omitted — we do not estimate them.
        </p>

        {regions.length === 0 ? (
          <p className="mt-8 text-sm text-text-secondary" role="status">
            No regional impact data is available yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {regions.map((region) => {
              const selected = selectedRegionId === region.id;
              const sources =
                region.sourceNames && region.sourceNames.length > 0
                  ? region.sourceNames
                  : region.sourceName
                    ? [region.sourceName]
                    : [];

              return (
                <li key={region.id}>
                  <button
                    type="button"
                    id={`needs-region-${region.id}`}
                    aria-pressed={selected}
                    onClick={() => onSelectRegion?.(region.id)}
                    className={cn(
                      "w-full rounded-lg border border-border/70 bg-panel/80 px-4 py-4 text-left transition-colors hover:border-border hover:bg-panel-raised/80 focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "border-border bg-panel-raised ring-1 ring-ring/40",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            region.severity === "severe" && "bg-severity-severe",
                            region.severity === "high" && "bg-severity-high",
                            region.severity === "moderate" &&
                              "bg-severity-moderate",
                            region.severity === "low" && "bg-severity-low",
                          )}
                          aria-hidden="true"
                        />
                        {region.name}
                      </h3>
                      <SeverityBadge severity={region.severity} />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Metric label="Affected" value={region.affected} />
                      <Metric label="Deaths" value={region.deaths} />
                      <Metric label="Injured" value={region.injured} />
                      <Metric label="Displaced" value={region.displaced} />
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                      {region.lastUpdatedLabel ? (
                        <span>Updated {region.lastUpdatedLabel}</span>
                      ) : null}
                      {sources.length > 0 ? (
                        <span>Source: {sources.join(", ")}</span>
                      ) : null}
                      {selected ? (
                        <span className="font-medium text-severity-severe">
                          Highlighted on map
                        </span>
                      ) : (
                        <span className="text-severity-severe">
                          Select to highlight on map
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
