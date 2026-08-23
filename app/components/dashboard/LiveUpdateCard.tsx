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
        "flex min-h-0 flex-col justify-between gap-2 px-4 pt-1 pb-2",
        className,
      )}
      id="overview"
    >
      <div className="min-h-0">
        <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] text-severity-severe uppercase">
          <span
            className="size-1.5 rounded-full bg-severity-severe"
            aria-hidden="true"
          />
          Live update
        </p>
        <h2 className="max-w-[11ch] text-[26px] leading-[1.15] font-medium tracking-tight text-foreground">
          {data.headline}
        </h2>
        <p className="mt-2 text-[11px] leading-relaxed font-light text-text-secondary">
          {data.summary}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
          <Clock3 className="size-3" aria-hidden="true" />
          Last updated:{" "}
          <time className="font-medium text-foreground">
            {data.lastUpdatedLabel}
          </time>
        </p>
        {data.isLive ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px]">
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
