import { cn } from "@/lib/utils";

/** Soft edge fades so floating panels stay readable over the live map. */
export function MapVignette({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-linear-to-b from-background/25 via-transparent to-background/30" />
      <div className="absolute inset-y-0 left-0 w-[12%] bg-linear-to-r from-background/45 via-background/10 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-[12%] bg-linear-to-l from-background/45 via-background/10 to-transparent" />
    </div>
  );
}

export { MapChrome, ZoomControls, ImpactLegend } from "@/components/map/MapChrome";
export { MapLoadingOverlay } from "@/components/map/MapLoadingOverlay";
