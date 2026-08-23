"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const legendItems = [
  { label: "Severe", className: "bg-severity-severe" },
  { label: "High", className: "bg-severity-high" },
  { label: "Moderate", className: "bg-severity-moderate" },
  { label: "Low", className: "bg-severity-low" },
] as const;

export function ZoomControls({
  className,
  onZoomIn,
  onZoomOut,
}: {
  className?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}) {
  const interactive = Boolean(onZoomIn && onZoomOut);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/50 bg-panel/90 shadow-md backdrop-blur-xl",
        interactive ? "pointer-events-auto" : "pointer-events-none",
        className,
      )}
      role={interactive ? "group" : undefined}
      aria-label={interactive ? "Map zoom" : undefined}
      aria-hidden={interactive ? undefined : true}
    >
      <button
        type="button"
        className="flex flex-1 items-center justify-center text-foreground transition-colors hover:bg-panel-raised focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        onClick={onZoomIn}
        disabled={!interactive}
        aria-label="Zoom in"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
      <span className="mx-auto h-px w-[70%] bg-border/70" aria-hidden="true" />
      <button
        type="button"
        className="flex flex-1 items-center justify-center text-foreground transition-colors hover:bg-panel-raised focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        onClick={onZoomOut}
        disabled={!interactive}
        aria-label="Zoom out"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ImpactLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none flex h-full w-full flex-col rounded-[10px] border border-border/50 bg-panel/90 px-3.5 py-3.5 shadow-md backdrop-blur-xl",
        className,
      )}
    >
      <p className="mb-3 text-[11px] font-bold tracking-[0.08em] text-foreground uppercase">
        Impact level
      </p>
      <ul className="space-y-2.5">
        {legendItems.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2.5 text-xs text-foreground"
          >
            <span
              className={cn("size-2.5 shrink-0 rounded-full", item.className)}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
      <div className="my-3 h-px bg-border-subtle" />
      <div className="flex items-center gap-2.5 text-[11px] text-foreground">
        <span
          className="relative flex size-4 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          <span className="absolute inset-0 rounded-full border border-severity-severe/35" />
          <span className="absolute inset-[18%] rounded-full border border-severity-severe/55" />
          <span className="size-1.5 rounded-full bg-severity-severe" />
        </span>
        Epicenter
      </div>
    </div>
  );
}

export function MapChrome({
  className,
  variant = "all",
  onZoomIn,
  onZoomOut,
}: {
  className?: string;
  variant?: "all" | "zoom" | "legend";
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}) {
  if (variant === "zoom") {
    return (
      <ZoomControls
        className={className}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
    );
  }
  if (variant === "legend") {
    return <ImpactLegend className={className} />;
  }

  return (
    <div className={cn("pointer-events-none relative h-full", className)}>
      <ZoomControls
        className="absolute top-3 left-3 h-[68px] w-[34px]"
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
      <ImpactLegend className="absolute top-3 right-3 h-[206px] w-[122px]" />
    </div>
  );
}
