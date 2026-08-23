import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const legendItems = [
  { label: "Severe", className: "bg-severity-severe" },
  { label: "High", className: "bg-severity-high" },
  { label: "Moderate", className: "bg-severity-moderate" },
  { label: "Low", className: "bg-severity-low" },
] as const;

export function MapBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src="/map-reference.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-95"
      />
      <div className="absolute inset-0 bg-linear-to-b from-background/35 via-transparent to-background/50" />
      <div className="absolute inset-y-0 left-0 w-[18%] bg-linear-to-r from-background/75 via-background/25 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-[20%] bg-linear-to-l from-background/75 via-background/25 to-transparent" />
    </div>
  );
}

function ZoomControls({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none flex h-full w-full flex-col overflow-hidden rounded-lg border border-border/50 bg-panel/90 shadow-md backdrop-blur-xl",
        className,
      )}
      aria-hidden="true"
    >
      <span className="flex flex-1 items-center justify-center text-foreground">
        <Plus className="size-3.5" />
      </span>
      <span className="mx-auto h-px w-[70%] bg-border/70" />
      <span className="flex flex-1 items-center justify-center text-foreground">
        <Minus className="size-3.5" />
      </span>
    </div>
  );
}

function ImpactLegend({ className }: { className?: string }) {
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
}: {
  className?: string;
  variant?: "all" | "zoom" | "legend";
}) {
  if (variant === "zoom") {
    return <ZoomControls className={className} />;
  }
  if (variant === "legend") {
    return <ImpactLegend className={className} />;
  }

  return (
    <div className={cn("pointer-events-none relative h-full", className)}>
      <ZoomControls className="absolute top-3 left-3 h-[68px] w-[34px]" />
      <ImpactLegend className="absolute top-3 right-3 h-[206px] w-[122px]" />
    </div>
  );
}

export function MapRegion({ className }: { className?: string }) {
  return (
    <section
      aria-label="Impact map of Colombia"
      className={cn(
        "relative h-56 overflow-hidden rounded-[10px] border border-border sm:h-72",
        className,
      )}
    >
      <Image
        src="/map-reference.png"
        alt="Map of Colombia showing earthquake impact by region"
        fill
        sizes="100vw"
        className="object-cover object-[center_30%]"
      />
      <div className="absolute inset-0 bg-background/20" />
      <ImpactLegend className="absolute right-3 bottom-3 h-auto w-[122px]" />
    </section>
  );
}
