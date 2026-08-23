import { Heart, Menu } from "lucide-react";
import { HelpColombiaLogo } from "@/components/brand/HelpColombiaLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#overview", label: "Overview" },
  { href: "#updates", label: "Updates" },
  { href: "#how-to-help", label: "Organizations" },
  { href: "#impact", label: "Impact" },
  { href: "#how-to-help", label: "How to Help" },
] as const;

export function Header({ className }: { className?: string }) {
  return (
    <header className={cn("chrome-surface relative z-30", className)}>
      <div className="header-inner flex h-16 items-center justify-between gap-6 px-6">
        <HelpColombiaLogo showTagline />

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {navItems.map((item, index) => (
            <a
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                index === 0 &&
                  "text-foreground underline decoration-severity-severe decoration-2 underline-offset-[14px]",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="lg"
            className="hidden h-10 gap-2 px-5 text-xs font-semibold tracking-wide uppercase sm:inline-flex"
          >
            <a href="#how-to-help">
              <Heart className="size-4" aria-hidden="true" />
              Donate Now
            </a>
          </Button>

          <details className="relative xl:hidden">
            <summary
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-panel text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" aria-hidden="true" />
            </summary>
            <div className="absolute top-full right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-panel-raised p-2 shadow-xl">
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {navItems.map((item) => (
                  <a
                    key={`mobile-${item.label}`}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-panel hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ))}
                <a
                  href="#how-to-help"
                  className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold tracking-wide text-primary-foreground uppercase"
                >
                  <Heart className="size-3.5" aria-hidden="true" />
                  Donate Now
                </a>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
