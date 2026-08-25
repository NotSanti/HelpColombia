import { Activity, CalendarDays, Clock3, MapPin, Mountain } from "lucide-react";
import type { EarthquakeFacts } from "@/types/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

export function WhatHappenedCard({
  data,
  className,
  showSectionLinks = true,
}: {
  data: EarthquakeFacts;
  className?: string;
  showSectionLinks?: boolean;
}) {
  const rows = [
    { icon: CalendarDays, value: data.occurredAtLabel },
    { icon: Clock3, value: data.timeLabel },
    { icon: MapPin, value: data.epicenter },
    { icon: Mountain, value: `Depth: ${data.depthKm} km` },
    { icon: Activity, value: data.aftershocksLabel },
  ] as const;

  return (
    <Panel className={cn("flex min-h-0 flex-col px-4 pt-3 pb-2", className)}>
      <h2 className="mb-1.5 flex shrink-0 items-center gap-2 text-base font-medium tracking-wide text-foreground uppercase">
        <Activity
          className="size-5 shrink-0 text-severity-severe"
          aria-hidden="true"
          strokeWidth={2.5}
        />
        What happened?
      </h2>
      <div className="grid min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <div className="flex w-[88px] flex-col items-center text-center">
          <div
            className="relative mb-1 flex size-12 items-center justify-center"
            aria-hidden="true"
          >
            <span className="absolute inset-0 rounded-full border border-severity-severe/25" />
            <span className="absolute inset-[12%] rounded-full border border-severity-severe/40" />
            <span className="absolute inset-[26%] rounded-full border-2 border-severity-severe/70" />
            <span className="size-1.5 rounded-full bg-severity-severe shadow-[0_0_12px_rgba(239,51,64,0.7)]" />
          </div>
          <p className="metric-value text-[23px] leading-none font-bold tracking-tight text-severity-severe">
            {data.magnitude.toFixed(1)}
          </p>
          <p className="mt-1 text-[11px] font-medium text-text-secondary">
            Magnitude
          </p>
        </div>

        <dl className="space-y-1.5 pt-0.5">
          {rows.map((row) => (
            <div key={row.value} className="flex items-start gap-2">
              <row.icon
                className="mt-0.5 size-3.5 shrink-0 text-text-secondary"
                aria-hidden="true"
              />
              <dd className="text-[11px] leading-snug text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {showSectionLinks ? (
        <a
          href="#updates"
          className="mt-auto inline-flex shrink-0 pt-1.5 text-x10 font-medium text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          View full timeline →
        </a>
      ) : null}
    </Panel>
  );
}
