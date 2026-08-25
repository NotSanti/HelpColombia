import { Clock3 } from "lucide-react";
import type { LiveStatus } from "@/types/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

export function LiveUpdateCard({
  data,
  className,
}: {
  data: LiveStatus;
  className?: string;
}) {
  return (
    <Panel
      className={cn(
        "flex min-h-0 flex-col justify-between gap-1 px-3.5 pt-0.5 pb-2",
        className,
      )}
      id="overview"
    >
      <div className="min-h-0">
        <p className="mb-0.5 inline-flex items-center gap-1 text-[10px] font-medium tracking-[0.14em] text-severity-severe uppercase">
          <span
            className="size-1.5 rounded-full bg-severity-severe"
            aria-hidden="true"
          />
          Live update
        </p>
        <h2 className=" text-[22px] leading-[1.1] font-medium tracking-tight text-foreground">
          {data.headline}
        </h2>
        <p className="mt-1 text-[11px] leading-snug text-text-secondary">
          {data.summary}
        </p>
      </div>
      <div className="flex shrink-0 flex-nowrap items-center justify-between gap-2">
        <p className="inline-flex min-w-0 items-center gap-1 text-x10 leading-snug whitespace-nowrap text-text-secondary">
          <Clock3 className="size-2.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            Last updated{" "}
            <time className="font-medium text-foreground">
              {data.lastUpdatedLabel}
            </time>
          </span>
        </p>
        {data.isLive ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-x10 leading-snug whitespace-nowrap">
            <span
              className="size-1.5 rounded-full bg-severity-low"
              aria-hidden="true"
            />
            Live data
          </span>
        ) : null}
      </div>
    </Panel>
  );
}
