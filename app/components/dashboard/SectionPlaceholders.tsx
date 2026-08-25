import { SECTION_PLACEHOLDERS } from "@/lib/navigation/sections";

/**
 * Minimal Phase 2 section anchors — full content arrives in later milestones.
 * `#updates` is rendered by UpdatesSection (Milestone 14).
 */
export function SectionPlaceholders() {
  const placeholders = SECTION_PLACEHOLDERS.filter((s) => s.id !== "updates");

  return (
    <div className="relative z-20 bg-background">
      {placeholders.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className="scroll-mt-section border-t border-border/50 px-4 py-16 sm:px-6 md:py-20"
        >
          <div className="mx-auto max-w-3xl">
            <h2
              id={`${section.id}-heading`}
              className="text-2xl font-semibold tracking-tight text-foreground"
            >
              {section.title}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">{section.description}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
