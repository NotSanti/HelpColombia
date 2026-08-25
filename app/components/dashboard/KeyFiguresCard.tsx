import { Activity, HeartPulse, Home, Users, UserRoundX } from "lucide-react";
import type { KeyFigure } from "@/types/dashboard";
import { Panel, PanelTitle } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

const toneClass = {
  severe: "text-severity-severe bg-severity-severe/15",
  info: "text-info bg-info/15",
  high: "text-severity-high bg-severity-high/15",
  low: "text-severity-low bg-severity-low/15",
} as const;

const icons = {
  deaths: UserRoundX,
  injured: HeartPulse,
  affected: Users,
  displaced: Home,
  aftershocks: Activity,
} as const;

export function KeyFiguresCard({
  figures,
  className,
  showSectionLinks = true,
}: {
  figures: KeyFigure[];
  className?: string;
  showSectionLinks?: boolean;
}) {
  const cells = figures.slice(0, 4);

  return (
    <Panel
      className={cn(
        "flex min-h-0 flex-col overflow-hidden px-3.5 pt-3 pb-2",
        className,
      )}
    >
      <PanelTitle className="mb-1 shrink-0">Key figures</PanelTitle>
      <ul className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2">
        {cells.map((figure, index) => {
          const Icon =
            icons[figure.id as keyof typeof icons] ?? HeartPulse;
          const top = index < 2;
          const left = index % 2 === 0;
          const sourceLine = figure.sourceName
            ? `${figure.sourceName}${
                figure.reportedAtLabel ? ` · ${figure.reportedAtLabel}` : ""
              }`
            : undefined;

          return (
            <li
              key={figure.id}
              className={cn(
                "flex min-h-0 min-w-0 items-center overflow-hidden px-2",
                top && "border-b border-border-subtle",
                left && "border-r border-border-subtle pl-0",
                !left && "pr-0",
              )}
              title={sourceLine}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                    toneClass[figure.tone],
                  )}
                >
                  <Icon
                    className="size-4"
                    aria-hidden="true"
                    strokeWidth={2.25}
                  />
                </span>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="metric-value truncate text-lg leading-none font-medium tracking-tight text-foreground tabular-nums">
                    {figure.value}
                  </p>
                  <p className="mt-1 truncate text-x10 leading-tight text-text-secondary">
                    {figure.label}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {showSectionLinks ? (
        <a
          href="#needs"
          className="mt-auto inline-flex shrink-0 pt-1.5 text-x10 font-medium text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          See affected areas →
        </a>
      ) : null}
    </Panel>
  );
}
