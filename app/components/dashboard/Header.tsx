"use client";

import { useEffect, useState } from "react";
import { Heart, Menu } from "lucide-react";
import { HelpColombiaLogo } from "@/components/brand/HelpColombiaLogo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import { PRIMARY_NAV, SECTION_IDS, type SectionId } from "@/lib/navigation/sections";
import { cn } from "@/lib/utils";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToSection(sectionId: SectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;

  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

export function Header({
  className,
  isOnePage = false,
}: {
  className?: string;
  isOnePage?: boolean;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isOnePage) return;

    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null,
    );
    if (elements.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId: SectionId = "overview";
        let bestRatio = -1;
        for (const id of SECTION_IDS) {
          const ratio = ratios.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestRatio > 0) {
          setActiveSection((prev) => {
            if (prev !== bestId) {
              const nextHash = `#${bestId}`;
              if (window.location.hash !== nextHash) {
                window.history.replaceState(null, "", nextHash);
              }
            }
            return bestId;
          });
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [isOnePage]);

  useEffect(() => {
    if (isOnePage) return;

    const onHash = () => {
      const hash = window.location.hash.replace("#", "") as SectionId;
      if (SECTION_IDS.includes(hash)) {
        setActiveSection(hash);
        scrollToSection(hash);
      }
    };

    const onPopState = () => {
      const hash = window.location.hash.replace("#", "") as SectionId;
      if (SECTION_IDS.includes(hash)) {
        setActiveSection(hash);
        scrollToSection(hash);
      } else if (!window.location.hash) {
        setActiveSection("overview");
        scrollToSection("overview");
      }
    };

    if (window.location.hash) {
      requestAnimationFrame(() => onHash());
    }

    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onPopState);
    };
  }, [isOnePage]);

  function handleNavClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    sectionId: SectionId,
  ) {
    event.preventDefault();
    setMenuOpen(false);
    const url = `#${sectionId}`;
    if (window.location.hash !== url) {
      window.history.pushState(null, "", url);
    }
    scrollToSection(sectionId);
    setActiveSection(sectionId);
  }

  return (
    <header
      className={cn(
        "chrome-surface chrome-surface-nav fixed inset-x-0 top-0 z-40 border-b border-border/30",
        className,
      )}
    >
      <div className="header-inner flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <HelpColombiaLogo showTagline />

        {!isOnePage ? (
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
            {PRIMARY_NAV.map((item) => {
              const isActive = activeSection === item.sectionId;
              return (
                <a
                  key={item.sectionId}
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  onClick={(event) => handleNavClick(event, item.sectionId)}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm font-medium transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring 2xl:px-2.5",
                    isActive
                      ? "text-foreground underline decoration-severity-severe decoration-2 underline-offset-[14px]"
                      : "text-text-secondary",
                  )}
                >
                  {item.shortLabel ? (
                    <>
                      <span className="2xl:hidden">{item.shortLabel}</span>
                      <span className="hidden 2xl:inline">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </a>
              );
            })}
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!isOnePage ? (
            <>
              <Button
                asChild
                size="lg"
                className="hidden h-10 gap-2 px-5 text-xs font-semibold tracking-wide uppercase sm:inline-flex"
              >
                <a
                  href="#help"
                  onClick={(event) => handleNavClick(event, "help")}
                >
                  <Heart className="size-4" aria-hidden="true" />
                  Donate Now
                </a>
              </Button>

              <div className="relative xl:hidden">
                <button
                  type="button"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-md border border-border bg-panel text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-primary-nav"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <Menu className="size-4" aria-hidden="true" />
                </button>
                {menuOpen ? (
                  <div
                    id="mobile-primary-nav"
                    className="absolute top-full right-0 z-40 mt-2 w-56 rounded-lg border border-border bg-panel-raised p-2 shadow-xl"
                  >
                    <nav className="flex flex-col gap-1" aria-label="Mobile">
                      {PRIMARY_NAV.map((item) => {
                        const isActive = activeSection === item.sectionId;
                        return (
                          <a
                            key={`mobile-${item.sectionId}`}
                            href={item.href}
                            aria-current={isActive ? "true" : undefined}
                            onClick={(event) =>
                              handleNavClick(event, item.sectionId)
                            }
                            className={cn(
                              "rounded-md px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring",
                              isActive
                                ? "bg-panel text-foreground"
                                : "text-text-secondary hover:bg-panel hover:text-foreground",
                            )}
                          >
                            {item.label}
                          </a>
                        );
                      })}
                      <a
                        href="#help"
                        onClick={(event) => handleNavClick(event, "help")}
                        className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold tracking-wide text-primary-foreground uppercase focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Heart className="size-3.5" aria-hidden="true" />
                        Donate Now
                      </a>
                    </nav>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
