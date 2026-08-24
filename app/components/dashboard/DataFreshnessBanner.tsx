import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardDataMode } from "@/types/dashboard";

const copy: Record<
  Exclude<DashboardDataMode, "live">,
  { title: string; detail: string }
> = {
  fixture: {
    title: "Demo data",
    detail:
      "Live database is not configured. Figures shown are static fixtures for local development.",
  },
  degraded: {
    title: "Live data temporarily unavailable",
    detail:
      "Showing last known cached figures while we reconnect to official sources.",
  },
};

export function DataFreshnessBanner({
  mode,
  lastUpdatedLabel,
  className,
}: {
  mode: DashboardDataMode;
  lastUpdatedLabel: string;
  className?: string;
}) {
  if (mode === "live") return null;

  const message = copy[mode];

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2 border-b border-border bg-panel-alt/80 px-4 py-2 text-xs text-text-secondary backdrop-blur-sm",
        className,
      )}
    >
      <AlertTriangle
        className="mt-0.5 size-3.5 shrink-0 text-severity-high"
        aria-hidden="true"
      />
      <p>
        <span className="font-medium text-foreground">{message.title}.</span>{" "}
        {message.detail}{" "}
        <span className="text-foreground/80">
          Last updated {lastUpdatedLabel}.
        </span>
      </p>
    </div>
  );
}
