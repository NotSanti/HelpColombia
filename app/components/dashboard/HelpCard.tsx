import type { OrganizationHelp } from "@/types/dashboard";
import { Panel } from "@/components/dashboard/Panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const donateClass = {
  severe: "bg-severity-severe/95 text-white hover:bg-severity-severe",
  info: "bg-info/95 text-white hover:bg-info",
  high: "bg-severity-high/95 text-white hover:bg-severity-high",
} as const;

function orgVisual(name: string) {
  if (name.includes("Red Cross")) {
    return {
      mark: "✚",
      circle: "bg-white text-severity-severe",
      markClass: "text-[18px] leading-none font-bold",
    };
  }
  if (name === "UNICEF") {
    return {
      mark: "unicef",
      circle: "bg-info text-white",
      markClass: "text-[8px] font-bold lowercase tracking-tight",
    };
  }
  if (name === "WFP") {
    return {
      mark: "WFP",
      circle: "bg-[#0b65c9] text-info",
      markClass: "text-[13px] font-bold tracking-tight",
    };
  }
  if (name === "Direct Relief") {
    return {
      mark: "✦",
      circle: "bg-white text-severity-high",
      markClass: "text-[18px] leading-none font-bold",
    };
  }
  return {
    mark: name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join(""),
    circle: "bg-panel-alt text-foreground ring-1 ring-border-subtle",
    markClass: "text-[10px] font-bold",
  };
}

export function HelpCard({
  organizations,
  className,
}: {
  organizations: OrganizationHelp[];
  className?: string;
}) {
  return (
    <Panel
      className={cn("flex min-h-0 flex-col px-3.5 pt-3 pb-2", className)}
      id="how-to-help"
    >
      <h2 className="shrink-0 text-sm font-medium tracking-wide text-foreground uppercase">
        How can I help?
      </h2>
      <p className="mt-1 shrink-0 text-[11px] leading-snug text-text-secondary">
        Support verified organizations providing urgent aid.
      </p>
      <div className="mt-2 shrink-0 border-t border-border-subtle" />

      <ul className="flex min-h-0 flex-1 flex-col justify-between">
        {organizations.map((org, index) => {
          const visual = orgVisual(org.name);
          return (
            <li
              key={org.id}
              className={cn(
                "grid grid-cols-[2.5rem_minmax(0,1fr)_4.75rem] items-center gap-x-3 py-2",
                index < organizations.length - 1 && "border-b border-border-subtle",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
                  visual.circle,
                  visual.markClass,
                )}
                aria-hidden="true"
              >
                {visual.mark}
              </span>

              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-none text-foreground">
                  {org.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-text-secondary">
                  {org.summary}
                </p>
              </div>

              <div className="flex w-19 shrink-0 flex-col items-end gap-1">
                <Button
                  asChild
                  size="xs"
                  className={cn(
                    "h-7 w-full rounded-[5px] border-transparent px-0 text-[10px] font-bold tracking-wide uppercase",
                    donateClass[org.accent],
                  )}
                >
                  <a href="#how-to-help" aria-label={`Donate via ${org.name}`}>
                    Donate
                  </a>
                </Button>
                <a
                  href={org.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-[9px] leading-none text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {org.websiteLabel} ↗
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <a
        href="#how-to-help"
        className="mt-1.5 inline-flex shrink-0 text-[11px] font-normal text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        See more ways to help →
      </a>
    </Panel>
  );
}
