import { Droplets, HeartHandshake, Wheat } from "lucide-react";
import type { LiveUpdateItem } from "@/types/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

const accentClass = {
  info: "bg-info/15 text-info",
  high: "bg-severity-high/15 text-severity-high",
  severe: "bg-severity-severe/15 text-severity-severe",
} as const;

const icons = {
  UNICEF: Droplets,
  WFP: Wheat,
  "Red Cross": HeartHandshake,
  "Colombian Red Cross": HeartHandshake,
  ReliefWeb: Droplets,
} as const;

export function LiveUpdatesCard({
  updates,
  className,
}: {
  updates: LiveUpdateItem[];
  className?: string;
}) {
  return (
    <Panel className={cn("flex flex-col p-3.5", className)}>
      <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
          <span
            className="size-1.5 rounded-full bg-severity-severe"
            aria-hidden="true"
          />
          Live updates
        </h2>
        <a
          href="#updates"
          className="text-x10 font-medium text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all updates →
        </a>
      </div>
      <ul className="grid min-h-0 flex-1 grid-cols-1 gap-0 sm:grid-cols-3">
        {updates.slice(0, 3).map((update, index) => {
          const Icon =
            icons[update.source as keyof typeof icons] ?? Droplets;
          return (
            <li
              key={update.id}
              className={cn(
                "flex gap-2.5 px-2.5 py-0.5",
                index > 0 &&
                  "border-t border-border-subtle sm:border-t-0 sm:border-l",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                  accentClass[update.accent],
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-x10 font-medium text-text-secondary">
                  <time>{update.relativeTime}</time>
                  <span className="mx-1 text-border">·</span>
                  {update.source}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-foreground">
                  {update.title}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
