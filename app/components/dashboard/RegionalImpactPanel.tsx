"use client";

import { ArrowRight, Hand, Users, UserRoundX } from "lucide-react";
import type { RegionImpact } from "@/types/dashboard";
import { Panel, PanelTitle, SeverityBadge } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

export function RegionalImpactPanel({
  regions,
  className,
  selectedRegionId,
  hoveredRegionId,
  onSelectRegion,
  onHoverRegion,
  linkToNeeds = true,
}: {
  regions: RegionImpact[];
  className?: string;
  selectedRegionId?: string | null;
  hoveredRegionId?: string | null;
  onSelectRegion?: (regionId: string) => void;
  onHoverRegion?: (regionId: string | null) => void;
  linkToNeeds?: boolean;
}) {
  return (
    <Panel className={cn("flex flex-col p-2.5", className)}>
      <div className="mb-1.5 shrink-0">
        <PanelTitle className="mb-0.5 text-[11px]">
          Who needs help most?
        </PanelTitle>
        <p className="text-[11px] leading-snug text-text-secondary">
          {linkToNeeds
            ? "Select a region below or on the map for details. Open Who Needs Help for the full regional list."
            : "Select a region below or on the map for details. This list is the accessible alternative to the map view."}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-6">
        {regions.map((region) => {
          const active =
            selectedRegionId === region.id || hoveredRegionId === region.id;
          return (
            <li key={region.id}>
              <button
                type="button"
                id={`region-${region.id}`}
                aria-pressed={selectedRegionId === region.id}
                onClick={() => {
                  onSelectRegion?.(region.id);
                  if (!linkToNeeds) return;
                  const target = document.getElementById(
                    `needs-region-${region.id}`,
                  );
                  target?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "auto"
                      : "smooth",
                    block: "start",
                  });
                  if (window.location.hash !== "#needs") {
                    window.history.pushState(null, "", "#needs");
                  }
                }}
                onMouseEnter={() => onHoverRegion?.(region.id)}
                onMouseLeave={() => onHoverRegion?.(null)}
                onFocus={() => onHoverRegion?.(region.id)}
                onBlur={() => onHoverRegion?.(null)}
                className={cn(
                  "flex h-full w-full flex-col rounded-md border border-border-subtle/60 bg-panel-alt/45 px-2 py-1.5 text-left backdrop-blur-sm transition-colors hover:border-border hover:bg-panel-raised/55 focus-visible:ring-2 focus-visible:ring-ring",
                  active && "border-border bg-panel-raised/70 ring-1 ring-ring/40",
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-1">
                  <h3 className="inline-flex items-center gap-1 text-[12px] font-semibold text-foreground">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        region.severity === "severe" && "bg-severity-severe",
                        region.severity === "high" && "bg-severity-high",
                        region.severity === "moderate" && "bg-severity-moderate",
                        region.severity === "low" && "bg-severity-low",
                      )}
                      aria-hidden="true"
                    />
                    {region.name}
                  </h3>
                  <SeverityBadge
                    severity={region.severity}
                    className="px-1 py-px text-[9px]"
                  />
                </div>
                <dl className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <UserRoundX
                      className="size-4 shrink-0 text-text-secondary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <dd className="metric-value text-[12px] leading-none font-semibold text-foreground">
                        {region.deaths}
                      </dd>
                      <dt className="mt-px text-xxs text-text-secondary">
                        Deaths
                      </dt>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users
                      className="size-4 shrink-0 text-text-secondary"
                      aria-hidden="true"
                      />
                    <div className="min-w-0">
                      <dd className="metric-value text-[12px] leading-none font-semibold text-foreground">
                        {region.affected}
                      </dd>
                      <dt className="mt-px text-xxs text-text-secondary">
                        Affected
                      </dt>
                    </div>
                  </div>
                </dl>
                <span className="mt-1 inline-flex items-center gap-0.5 text-xxs font-medium text-severity-severe">
                  {linkToNeeds ? "View details" : "View on map"}
                  <ArrowRight className="size-2.5" aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
        <li>
          <div className="panel-dashed flex h-full min-h-0 flex-col items-center justify-center gap-1 px-2 py-1.5 text-center">
            <Hand className="size-4 text-text-secondary" aria-hidden="true" />
            <p className="text-xxs leading-snug text-text-secondary">
              Hover on the map
              <br />
              or use these cards
              <br />
              for region details.
            </p>
          </div>
        </li>
      </ul>
    </Panel>
  );
}
