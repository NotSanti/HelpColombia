import { ArrowRight, Hand, Users, UserRoundX } from "lucide-react";
import type { RegionImpact } from "@/types/dashboard";
import { Panel, PanelTitle, SeverityBadge } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

export function RegionalImpactPanel({
  regions,
  className,
}: {
  regions: RegionImpact[];
  className?: string;
}) {
  return (
    <Panel id="regions" className={cn("flex flex-col p-2.5", className)}>
      <div className="mb-1.5 shrink-0">
        <PanelTitle className="mb-0.5 text-[11px]">
          Who needs help most?
        </PanelTitle>
        <p className="text-[11px] leading-snug text-text-secondary">
          Hover over regions on the map or explore below.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-6">
        {regions.map((region) => (
          <li key={region.id}>
            <a
              href={`#region-${region.id}`}
              id={`region-${region.id}`}
              className="flex h-full flex-col rounded-md border border-border-subtle/60 bg-panel-alt/45 px-2 py-1.5 backdrop-blur-sm transition-colors hover:border-border hover:bg-panel-raised/55 focus-visible:ring-2 focus-visible:ring-ring"
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
                View details
                <ArrowRight className="size-2.5" aria-hidden="true" />
              </span>
            </a>
          </li>
        ))}
        <li>
          <div className="panel-dashed flex h-full min-h-0 flex-col items-center justify-center gap-1 px-2 py-1.5 text-center">
            <Hand className="size-4 text-text-secondary" aria-hidden="true" />
            <p className="text-xxs leading-snug text-text-secondary">
              Hover on the map
              <br />
              to see more details
              <br />
              about any region.
            </p>
          </div>
        </li>
      </ul>
    </Panel>
  );
}
