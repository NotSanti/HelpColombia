import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { UpdatesSection } from "@/components/dashboard/UpdatesSection";
import type { LiveUpdateItem } from "@/types/dashboard";

const sample: LiveUpdateItem[] = [
  {
    id: "1",
    source: "ReliefWeb",
    title: "Situation report",
    relativeTime: "2 hours ago",
    accent: "info",
    summary: "Plain text summary only.",
    sourceUrl: "https://reliefweb.int/example",
    publishedAtLabel: "Aug 20, 2025, 3:00 PM",
    retrievedAt: new Date().toISOString(),
  },
];

describe("UpdatesSection", () => {
  it("renders chronological feed with provenance and external source link", () => {
    const html = renderToStaticMarkup(
      createElement(UpdatesSection, { updates: sample, dataMode: "live" }),
    );
    expect(html).toContain('id="updates"');
    expect(html).toContain("Situation report");
    expect(html).toContain("ReliefWeb");
    expect(html).toContain("Plain text summary only.");
    expect(html).toContain('href="https://reliefweb.int/example"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("shows empty state when there are no updates", () => {
    const html = renderToStaticMarkup(
      createElement(UpdatesSection, { updates: [], dataMode: "live" }),
    );
    expect(html).toContain("No updates have been published yet");
  });

  it("surfaces stale notice for fixture mode without clearing the feed", () => {
    const html = renderToStaticMarkup(
      createElement(UpdatesSection, { updates: sample, dataMode: "fixture" }),
    );
    expect(html).toContain("Showing demo updates");
    expect(html).toContain("Situation report");
  });
});
