import { ShieldCheck } from "lucide-react";
import type { OrganizationHelp } from "@/types/dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const donateClass = {
  severe: "bg-severity-severe/95 text-white hover:bg-severity-severe",
  info: "bg-info/95 text-white hover:bg-info",
  high: "bg-severity-high/95 text-white hover:bg-severity-high",
} as const;

export function HelpSection({
  organizations,
  className,
}: {
  organizations: OrganizationHelp[];
  className?: string;
}) {
  const donateOrgs = organizations.filter((org) => org.canDonate);

  return (
    <section
      id="help"
      aria-labelledby="help-heading"
      className={cn(
        "scroll-mt-section border-t border-border/50 bg-background px-4 py-12 sm:px-6 md:py-16",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="help-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          How to Help
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          What you can safely do right now — through verified organizations
          only.
        </p>

        <div className="mt-6 rounded-lg border border-border/70 bg-panel-alt/70 px-4 py-4">
          <p className="inline-flex items-start gap-2 text-sm text-foreground">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-severity-severe"
              aria-hidden="true"
            />
            <span>
              Help Colombia does not collect or process donations. Donation
              links take you to verified official organization websites.
            </span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-text-secondary">
            Destinations are reviewed server-side: HTTPS only, matching an
            approved hostname, marked verified and enabled in our database.
            CTAs use opaque{" "}
            <code className="text-[11px]">/out/&#123;organization&#125;</code>{" "}
            redirects — the browser never chooses an arbitrary donation URL.
            Unexpected redirects or host changes disable the link until review.
          </p>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Donate safely
          </h3>
          {donateOrgs.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary" role="status">
              No verified donation destinations are available right now.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {donateOrgs.map((org) => (
                <li
                  key={org.id}
                  className="rounded-lg border border-border/70 bg-panel/80 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-semibold text-foreground">
                        {org.name}
                      </h4>
                      {org.summary ? (
                        <p className="mt-1 text-sm text-text-secondary">
                          {org.summary}
                        </p>
                      ) : null}
                      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                        {org.donationVerified ? (
                          <div>
                            <dt className="inline font-medium text-foreground">
                              Status:
                            </dt>{" "}
                            <dd className="inline">Verified destination</dd>
                          </div>
                        ) : null}
                        {org.approvedHostname ? (
                          <div>
                            <dt className="inline font-medium text-foreground">
                              Official domain:
                            </dt>{" "}
                            <dd className="inline font-mono text-[11px]">
                              {org.approvedHostname}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                    <Button
                      asChild
                      size="lg"
                      className={cn(
                        "shrink-0 text-xs font-semibold tracking-wide uppercase",
                        donateClass[org.accent],
                      )}
                    >
                      <a
                        href={`/out/${encodeURIComponent(org.slug)}`}
                        aria-label={`Donate safely via ${org.name}`}
                      >
                        Donate safely
                      </a>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Other ways to help
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>
              Share verified information from this site or linked official
              sources — not unverified social posts.
            </li>
            <li>
              Follow official updates from UNGRD, IFRC, and the organizations
              listed above.
            </li>
            <li>
              Avoid unverified crowdfunding campaigns and donation pages that
              are not on an organization&apos;s official domain.
            </li>
          </ul>
          <p className="mt-3 text-xs text-text-secondary">
            We do not recommend shipping physical goods or volunteering unless
            a trusted organization explicitly asks for it.
          </p>
        </div>
      </div>
    </section>
  );
}
