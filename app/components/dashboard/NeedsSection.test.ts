import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NeedsSection } from "@/components/dashboard/NeedsSection";
import type { RegionImpact } from "@/types/dashboard";

const regions: RegionImpact[] = [
  {
    id: "choco",
    name: "Chocó",
    severity: "severe",
    deaths: "128+",
    affected: "38,200+",
    injured: "420+",
    sourceNames: ["UNGRD"],
    lastUpdatedLabel: "2 hours ago",
  },
  {
    id: "cauca",
    name: "Cauca",
    severity: "moderate",
    deaths: "20+",
    affected: "7,900+",
  },
];

describe("NeedsSection", () => {
  it("renders regional needs with available metrics only", () => {
    const html = renderToStaticMarkup(
      createElement(NeedsSection, { regions, selectedRegionId: "choco" }),
    );
    expect(html).toContain('id="needs"');
    expect(html).toContain("Chocó");
    expect(html).toContain("38,200+");
    expect(html).toContain("Injured");
    expect(html).toContain("420+");
    expect(html).toContain("Source: UNGRD");
    expect(html).not.toContain("Displaced");
  });

  it("shows empty state when no regions are available", () => {
    const html = renderToStaticMarkup(
      createElement(NeedsSection, { regions: [] }),
    );
    expect(html).toContain("No regional impact data is available yet");
  });
});
