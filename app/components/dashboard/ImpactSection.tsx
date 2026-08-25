import type {
  ImpactObservationView,
  KeyFigure,
  RegionImpact,
} from "@/types/dashboard";
import { SeverityBadge } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils";

/**
 * Discrete observation markers — no interpolated series, no chart library.
 * Points are only drawn for actual reported observations.
 */
function ObservationSpark({
  points,
  label,
}: {
  points: ImpactObservationView[];
  label: string;
}) {
  if (points.length < 2) return null;

  const chronological = [...points].sort((a, b) =>
    a.sortAt.localeCompare(b.sortAt),
  );
  const values = chronological.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 48;
  const pad = 6;

  const coords = chronological.map((point, index) => {
    const x =
      pad +
      (index / Math.max(chronological.length - 1, 1)) * (width - pad * 2);
    const y =
      height - pad - ((point.value - min) / range) * (height - pad * 2);
    return { x, y, point };
  });

  return (
    <figure className="mt-3">
      <figcaption className="sr-only">
        {label} reported observations over time. Values are discrete reports,
        not a continuous estimate.
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-12 w-full max-w-sm text-severity-severe"
        role="img"
        aria-hidden="true"
      >
        {coords.map((coord) => (
          <circle
            key={coord.point.id}
            cx={coord.x}
            cy={coord.y}
            r={3.5}
            fill="currentColor"
          />
        ))}
      </svg>
      <p className="mt-1 text-xxs text-text-secondary">
        {chronological.length} reported observations (dots only — no filled-in
        values between reports).
      </p>
    </figure>
  );
}

export function ImpactSection({
  keyFigures,
  regions,
  observations,
  className,
}: {
  keyFigures: KeyFigure[];
  regions: RegionImpact[];
  observations: ImpactObservationView[];
  className?: string;
}) {
  const nationalByType = new Map<string, ImpactObservationView[]>();
  for (const obs of observations) {
    if (obs.department) continue;
    const list = nationalByType.get(obs.metricType) ?? [];
    list.push(obs);
    nationalByType.set(obs.metricType, list);
  }

  return (
    <section
      id="impact"
      aria-labelledby="impact-heading"
      className={cn(
        "scroll-mt-section border-t border-border/50 bg-background px-4 py-12 sm:px-6 md:py-16",
        className,
      )}
    >
      <div className="mx-auto max-w-3xl">
        <h2
          id="impact-heading"
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          Impact
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Current headline figures and the underlying reported observations.
          Charts and tables use only actual source reports — missing dates are
          not filled in.
        </p>

        <div className="mt-8">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Current key figures
          </h3>
          {keyFigures.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              No national key figures are available yet.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {keyFigures.map((figure) => (
                <li
                  key={figure.id}
                  className="rounded-md border border-border/70 bg-panel/80 px-3 py-3"
                >
                  <p className="metric-value text-xl font-bold text-foreground">
                    {figure.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-text-secondary">
                    {figure.label}
                  </p>
                  {figure.sourceName ? (
                    <p className="mt-1 text-xxs text-text-secondary">
                      {figure.sourceName}
                      {figure.reportedAtLabel
                        ? ` · ${figure.reportedAtLabel}`
                        : ""}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Impact by region
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">
                Regional impact metrics by severity
              </caption>
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
                  <th className="py-2 pr-3">Region</th>
                  <th className="py-2 pr-3">Severity</th>
                  <th className="py-2 pr-3">Deaths</th>
                  <th className="py-2 pr-3">Affected</th>
                  <th className="py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-3 font-medium text-foreground">
                      {region.name}
                    </td>
                    <td className="py-2.5 pr-3">
                      <SeverityBadge severity={region.severity} />
                    </td>
                    <td className="metric-value py-2.5 pr-3 text-foreground">
                      {region.deaths}
                    </td>
                    <td className="metric-value py-2.5 pr-3 text-foreground">
                      {region.affected}
                    </td>
                    <td className="py-2.5 text-text-secondary">
                      {region.lastUpdatedLabel ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
            Reported observations
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            Append-only source reports. Each row is a discrete observation.
          </p>

          {[...nationalByType.entries()].map(([metricType, points]) => (
            <div key={metricType} className="mt-4">
              <p className="text-sm font-medium text-foreground">
                {points[0]?.label ?? metricType} (national)
              </p>
              <ObservationSpark points={points} label={points[0]?.label ?? metricType} />
            </div>
          ))}

          {observations.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              No metric observations have been recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">
                  Historical impact metric observations from trusted sources
                </caption>
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-text-secondary">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Metric</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2 pr-3">Location</th>
                    <th className="py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((obs) => (
                    <tr key={obs.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-3 text-text-secondary">
                        {obs.reportedAtLabel ?? obs.retrievedAtLabel}
                      </td>
                      <td className="py-2.5 pr-3 text-foreground">{obs.label}</td>
                      <td className="metric-value py-2.5 pr-3 font-medium text-foreground">
                        {obs.displayValue}
                      </td>
                      <td className="py-2.5 pr-3 text-text-secondary">
                        {obs.department ?? "National"}
                      </td>
                      <td className="py-2.5 text-text-secondary">
                        {obs.sourceUrl ? (
                          <a
                            href={obs.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-severity-severe underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {obs.sourceName}
                          </a>
                        ) : (
                          obs.sourceName
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
