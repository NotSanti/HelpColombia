import { ExternalLink } from "lucide-react";
import type { DashboardDataMode, LiveUpdateItem } from "@/types/dashboard";
import { cn } from "@/lib/utils";

const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

function isFeedStale(
  mode: DashboardDataMode,
  updates: LiveUpdateItem[],
): boolean {
  if (mode === "degraded" || mode === "fixture") return true;
  const newest = updates
    .map((u) => u.retrievedAt)
    .filter((iso): iso is string => Boolean(iso))
    .sort()
    .at(-1);
  if (!newest) return updates.length === 0;
  return Date.now() - new Date(newest).getTime() > STALE_AFTER_MS;
}

export function UpdatesSection({
  updates,
  dataMode,
  className,
}: {
  updates: LiveUpdateItem[];
  dataMode: DashboardDataMode;
  className?: string;
}) {
  const stale = isFeedStale(dataMode, updates);

  return (
    <section
      id="updates"
      aria-labelledby="updates-heading"
      className={cn(
        "scroll-mt-section border-t border-border/50 bg-background px-4 py-12 sm:px-6 md:py-16",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="updates-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Updates
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Chronological humanitarian updates from trusted sources. Newest first.
        </p>

        {stale ? (
          <p
            role="status"
            className="mt-4 rounded-md border border-border bg-panel-alt/80 px-3 py-2 text-xs text-text-secondary"
          >
            {dataMode === "fixture"
              ? "Showing demo updates. Connect live sources for the latest feed."
              : "This feed may be stale. Existing updates are still shown; a source outage will not clear them."}
          </p>
        ) : null}

        {updates.length === 0 ? (
          <p className="mt-8 text-sm text-text-secondary" role="status">
            No updates have been published yet for this event.
          </p>
        ) : (
          <ol className="mt-8 space-y-0">
            {updates.map((update) => (
              <li
                key={update.id}
                className="border-b border-border/60 py-5 first:pt-0 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-text-secondary">
                  <time dateTime={update.retrievedAt ?? undefined}>
                    {update.publishedAtLabel ?? update.relativeTime}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-foreground">
                    {update.source}
                  </span>
                  <span className="text-text-secondary">
                    ({update.relativeTime})
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-medium leading-snug text-foreground">
                  {update.title}
                </h3>
                {update.summary ? (
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {update.summary}
                  </p>
                ) : null}
                {update.sourceUrl ? (
                  <a
                    href={update.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    View original source
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
