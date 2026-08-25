import { ExternalLink } from "lucide-react";
import type { OrganizationHelp } from "@/types/dashboard";
import { cn } from "@/lib/utils";

function formatOrgType(type: string | null | undefined): string | null {
  if (!type?.trim()) return null;
  const labels: Record<string, string> = {
    ngo: "NGO",
    un: "United Nations",
    government: "Government",
    agency: "Agency",
    red_cross: "Red Cross / Red Crescent",
  };
  return labels[type] ?? type;
}

export function ResponseSection({
  organizations,
  className,
}: {
  organizations: OrganizationHelp[];
  className?: string;
}) {
  return (
    <section
      id="response"
      aria-labelledby="response-heading"
      className={cn(
        "scroll-mt-section border-t border-border/50 bg-background px-4 py-12 sm:px-6 md:py-16",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="response-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Who Is Helping
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Organizations responding to this disaster. Static profiles are
          separated from sourced operational updates — we do not invent
          activity claims.
        </p>

        {organizations.length === 0 ? (
          <p className="mt-8 text-sm text-text-secondary" role="status">
            No responding organizations are listed yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {organizations.map((org) => {
              const orgType = formatOrgType(org.organizationType);
              const hasOps =
                (org.activities && org.activities.length > 0) ||
                Boolean(org.activitySummary) ||
                Boolean(org.opsUpdateLabel) ||
                (org.metrics && org.metrics.length > 0);

              return (
                <li
                  key={org.id}
                  className="rounded-lg border border-border/70 bg-panel/80 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {org.name}
                      </h3>
                      {orgType ? (
                        <p className="mt-0.5 text-xs font-medium tracking-wide text-text-secondary uppercase">
                          {orgType}
                        </p>
                      ) : null}
                    </div>
                    {org.websiteUrl && org.websiteUrl !== "#" ? (
                      <a
                        href={org.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {org.websiteLabel}
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    ) : null}
                  </div>

                  {org.summary ? (
                    <div className="mt-3">
                      <p className="text-xxs font-semibold tracking-wide text-text-secondary uppercase">
                        Organization profile
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground">
                        {org.summary}
                      </p>
                    </div>
                  ) : null}

                  {hasOps ? (
                    <div className="mt-4 rounded-md border border-border-subtle bg-panel-alt/60 px-3 py-3">
                      <p className="text-xxs font-semibold tracking-wide text-text-secondary uppercase">
                        Current response activity
                        {org.responseSourceName
                          ? ` · ${org.responseSourceName}`
                          : ""}
                      </p>

                      {org.activitySummary ? (
                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                          {org.activitySummary}
                        </p>
                      ) : null}

                      {org.activities && org.activities.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                          {org.activities.map((activity) => (
                            <li key={activity}>{activity}</li>
                          ))}
                        </ul>
                      ) : null}

                      {org.metrics && org.metrics.length > 0 ? (
                        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {org.metrics.map((metric) => (
                            <div key={metric.label}>
                              <dt className="text-xs text-text-secondary">
                                {metric.label}
                              </dt>
                              <dd className="metric-value mt-0.5 text-sm font-semibold text-foreground">
                                {metric.value}
                              </dd>
                              <dd className="text-xxs text-text-secondary">
                                {metric.sourceName}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}

                      {org.opsUpdateLabel ? (
                        <p className="mt-3 text-sm text-text-secondary">
                          <span className="font-medium text-foreground">
                            Latest ops update:
                          </span>{" "}
                          {org.opsUpdateLabel}
                        </p>
                      ) : null}

                      {org.responseSourceUrl ? (
                        <a
                          href={org.responseSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          View response source
                          <ExternalLink
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          <span className="sr-only"> (opens in new tab)</span>
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-text-secondary">
                      No sourced operational update is available for this
                      organization yet.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
