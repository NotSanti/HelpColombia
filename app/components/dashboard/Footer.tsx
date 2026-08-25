import { Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Footer({
  dataSources,
  className,
}: {
  dataSources: string[];
  className?: string;
}) {
  return (
    <footer className={cn("chrome-surface relative z-30", className)}>
      <div className="footer-inner flex flex-col gap-3 px-6 py-3 text-xs text-text-secondary xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <p className="inline-flex items-start gap-2 xl:items-center">
          <ShieldCheck
            className="mt-0.5 size-3.5 shrink-0 text-severity-low xl:mt-0"
            aria-hidden="true"
          />
          <span>
            <span className="font-medium text-foreground">
              100% of donations go directly to verified organizations.
            </span>
          </span>
        </p>

        <span
          className="hidden h-4 w-px bg-border xl:block"
          aria-hidden="true"
        />

        <p>We do not collect or handle donations.</p>

        <span
          className="hidden h-4 w-px bg-border xl:block"
          aria-hidden="true"
        />

        <p>
          Data sources:{" "}
          <span className="text-foreground">{dataSources.join(", ")}</span>
        </p>

        <span
          className="hidden h-4 w-px bg-border xl:block"
          aria-hidden="true"
        />

        <a
          href="#impact"
          className="inline-flex items-center gap-1 text-x10 font-medium text-info underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-3.5" aria-hidden="true" />
          About our data →
        </a>
      </div>
    </footer>
  );
}
