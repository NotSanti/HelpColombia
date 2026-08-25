import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImpactSection } from "@/components/dashboard/ImpactSection";
import type {
  ImpactObservationView,
  KeyFigure,
  RegionImpact,
} from "@/types/dashboard";

const keyFigures: KeyFigure[] = [
  {
    id: "deaths",
    label: "Deaths",
    value: "312+",
    tone: "severe",
    sourceName: "UNGRD",
    reportedAtLabel: "2 hours ago",
  },
];

const regions: RegionImpact[] = [
  {
    id: "choco",
    name: "Chocó",
    severity: "severe",
    deaths: "128+",
    affected: "38,200+",
    lastUpdatedLabel: "2 hours ago",
  },
];

const observations: ImpactObservationView[] = [
  {
    id: "1",
    metricType: "deaths",
    label: "Deaths",
    displayValue: "312+",
    value: 312,
    department: null,
    sourceName: "UNGRD",
    reportedAtLabel: "Aug 20, 2025",
    retrievedAtLabel: "2 hours ago",
    sourceUrl: null,
    sortAt: "2025-08-20T15:00:00.000Z",
  },
  {
    id: "2",
    metricType: "deaths",
    label: "Deaths",
    displayValue: "280+",
    value: 280,
    department: null,
    sourceName: "UNGRD",
    reportedAtLabel: "Aug 18, 2025",
    retrievedAtLabel: "3 days ago",
    sourceUrl: null,
    sortAt: "2025-08-18T12:00:00.000Z",
  },
];

describe("ImpactSection", () => {
  it("renders current figures, regional table, and observation rows", () => {
    const html = renderToStaticMarkup(
      createElement(ImpactSection, {
        keyFigures,
        regions,
        observations,
      }),
    );
    expect(html).toContain('id="impact"');
    expect(html).toContain("Current key figures");
    expect(html).toContain("312+");
    expect(html).toContain("Impact by region");
    expect(html).toContain("Chocó");
    expect(html).toContain("Reported observations");
    expect(html).toContain("dots only");
  });
});
