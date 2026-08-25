import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HelpSection } from "@/components/dashboard/HelpSection";
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
    canDonate: true,
    donationVerified: true,
    approvedHostname: "www.cruzrojacolombiana.org",
  },
  {
    id: "pending-org",
    slug: "pending-org",
    name: "Pending Org",
    summary: "Should not appear in donate list.",
    websiteUrl: "https://example.com/",
    websiteLabel: "Official site",
    accent: "info",
    canDonate: false,
    donationVerified: false,
  },
];

describe("HelpSection", () => {
  it("uses opaque /out CTAs and trust copy without raw destination URLs", () => {
    const html = renderToStaticMarkup(
      createElement(HelpSection, { organizations }),
    );
    expect(html).toContain('id="help"');
    expect(html).toContain("does not collect or process donations");
    expect(html).toContain("www.cruzrojacolombiana.org");
    expect(html).toContain('href="/out/colombian-red-cross"');
    expect(html).toContain("Donate safely");
    expect(html).not.toContain("Pending Org");
    expect(html).not.toContain("https://www.cruzrojacolombiana.org/");
    expect(html).toContain("Other ways to help");
  });
});
