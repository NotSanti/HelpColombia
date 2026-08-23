import { cn } from "@/lib/utils";

type MapLoadingOverlayProps = {
  className?: string;
  /** When true, fades out (parent may unmount after transition). */
  fading?: boolean;
  /** Fired when the fade-out transition finishes (overlay is visually gone). */
  onFadedOut?: () => void;
};

/**
 * Full-bleed cover matching the map ocean. Colors come from `--map-water`
 * / `--map-loader-fg` on `:root` / `.dark` so light/dark track the html
 * theme class immediately (including before React hydrates).
 */
export function MapLoadingOverlay({
  className,
  fading = false,
  onFadedOut,
}: MapLoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center overflow-hidden",
        "bg-[var(--map-water)] transition-opacity duration-500 ease-out",
        fading ? "pointer-events-none opacity-0" : "opacity-100",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy={!fading}
      onTransitionEnd={(event) => {
        if (event.propertyName !== "opacity") return;
        if (!fading) return;
        onFadedOut?.();
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      >
        <div className="hc-map-loader-pulse absolute top-1/2 left-1/2 size-[min(42vw,280px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ef3340]/35" />
        <div className="hc-map-loader-pulse absolute top-1/2 left-1/2 size-[min(28vw,180px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ef3340]/50 [animation-delay:0.35s]" />
        <div className="hc-map-loader-pulse absolute top-1/2 left-1/2 size-[min(14vw,88px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ef3340]/70 [animation-delay:0.7s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
        <div
          className="hc-map-loader-core size-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(239,51,64,0.85)] dark:bg-white"
          aria-hidden="true"
        />
        <p className="text-[13px] tracking-[0.08em] text-[var(--map-loader-fg)] uppercase opacity-80">
          Loading map
        </p>
      </div>
    </div>
  );
}
