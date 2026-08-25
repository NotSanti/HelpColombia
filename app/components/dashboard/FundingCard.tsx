import { CircleDollarSign } from "lucide-react";
import type { FundingSector, FundingTotalItem } from "@/types/dashboard";
import { Panel, PanelTitle } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

const toneClass = {
  low: "text-severity-low bg-severity-low/15",
  info: "text-info bg-info/15",
  moderate: "text-severity-moderate bg-severity-moderate/15",
} as const;

export function FundingCard({
  totals,
  sectors,
  className,
  showSectionLinks = true,
}: {
  totals: FundingTotalItem[];
  sectors: FundingSector[];
  className?: string;
  showSectionLinks?: boolean;
}) {
  return (
    <Panel className={cn("flex min-h-0 flex-col px-2.5 pt-2.5 pb-1.5", className)}>
      <PanelTitle className="mb-0.5 shrink-0 text-x10">
        Where is the aid going?
      </PanelTitle>
      <p className="mb-1.5 shrink-0 text-x10 font-light text-text-secondary">
        Funding and resources making an impact.
      </p>

      <ul className="mb-1.5 grid min-h-0 flex-1 grid-cols-3 gap-1">
        {totals.map((item) => (
          <li
            key={item.id}
            className="flex h-full flex-col rounded-md border border-border-subtle/60 bg-panel-alt/35 px-1.5 py-2 backdrop-blur-sm"
          >
            <div className="flex items-start gap-1">
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                  toneClass[item.tone],
                )}
              >
                <CircleDollarSign className="size-3" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="metric-value text-xs leading-none font-semibold tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="mt-0.5 text-xxs leading-none text-foreground">
                  {item.label}
                </p>
              </div>
            </div>
            <p className="mt-auto pt-2 text-xxs leading-snug text-text-secondary">
              {item.detail}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-auto shrink-0">
        <h3 className="mb-1 text-xxs font-semibold tracking-[0.1em] text-text-secondary uppercase">
          Top sectors funded
        </h3>
        <ul className="flex gap-1" aria-label="Funding by sector">
          {sectors.map((sector) => (
            <li
              key={sector.id}
              className="flex min-w-[3.25rem] max-w-[5.5rem] flex-col gap-1"
              style={{ flex: `${sector.percent} 1 auto` }}
            >
              <span
                className="h-2 w-full max-w-full rounded-full"
                style={{ backgroundColor: sector.color }}
                title={`${sector.name} ${sector.percent}%`}
              />
              <span className="inline-flex items-center gap-0.5 text-xxs whitespace-nowrap text-text-secondary">
                <span
                  className="size-1 shrink-0 rounded-full"
                  style={{ backgroundColor: sector.color }}
                  aria-hidden="true"
                />
                <span className="text-foreground">{sector.name}</span>
              </span>
              <span className="metric-value pl-1.5 text-xxs font-semibold text-foreground">
                {sector.percent}%
              </span>
            </li>
          ))}
        </ul>
        {showSectionLinks ? (
          <a
            href="#impact"
            className="mt-1.5 inline-flex text-x10 font-medium text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            See full funding details →
          </a>
        ) : null}
      </div>
    </Panel>
  );
}
