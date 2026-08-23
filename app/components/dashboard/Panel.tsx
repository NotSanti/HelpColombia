import type { ReactNode } from "react";
import type { Severity } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const severityLabel: Record<Severity, string> = {
  severe: "Severe",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

const severityClass: Record<Severity, string> = {
  severe: "bg-severity-severe/15 text-severity-severe",
  high: "bg-severity-high/15 text-severity-high",
  moderate: "bg-severity-moderate/15 text-severity-moderate",
  low: "bg-severity-low/15 text-severity-low",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
        severityClass[severity],
        className,
      )}
    >
      {severityLabel[severity]}
    </span>
  );
}

export function Panel({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("panel-surface p-4", className)}>
      {children}
    </section>
  );
}

export function PanelTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "mb-3 text-xs font-semibold tracking-[0.12em] text-foreground uppercase",
        className,
      )}
    >
      {children}
    </h2>
  );
}
