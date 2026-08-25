import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResponseSection } from "@/components/dashboard/ResponseSection";
import type { OrganizationHelp } from "@/types/dashboard";

const organizations: OrganizationHelp[] = [
  {
    id: "colombian-red-cross",
    slug: "colombian-red-cross",
    name: "Colombian Red Cross",
    summary: "Local teams on the ground providing emergency relief.",
    websiteUrl: "https://www.cruzrojacolombiana.org/",
    websiteLabel: "Official site",
    accent: "severe",
    organizationType: "ngo",
    activities: ["Search and rescue", "Emergency health"],
    activitySummary: "Field teams supporting hardest-hit departments.",
    metrics: [
      { label: "People reached", value: "12,000", sourceName: "IFRC GO" },
    ],
    opsUpdateLabel: "Sitrep 3 · 1 day ago",
    responseSourceName: "IFRC GO",
    responseSourceUrl: "https://go.ifrc.org/emergencies/1",
  },
  {
    id: "unicef",
    slug: "unicef",
    name: "UNICEF",
    summary: "Supporting children and families with essential aid.",
    websiteUrl: "https://www.unicef.org/",
    websiteLabel: "Official site",
    accent: "info",
    organizationType: "un",
  },
];

describe("ResponseSection", () => {
  it("separates static profiles from sourced operational activity", () => {
    const html = renderToStaticMarkup(
      createElement(ResponseSection, { organizations }),
    );
    expect(html).toContain('id="response"');
    expect(html).toContain("Who Is Helping");
    expect(html).toContain("Organization profile");
    expect(html).toContain("Local teams on the ground");
    expect(html).toContain("Current response activity");
    expect(html).toContain("Search and rescue");
    expect(html).toContain("IFRC GO");
    expect(html).toContain("No sourced operational update is available");
  });
});
