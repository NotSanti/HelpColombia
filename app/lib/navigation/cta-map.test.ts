import { describe, expect, it } from "vitest";
import { PRIMARY_NAV } from "@/lib/navigation/sections";

/**
 * Milestone 19 — expected one-page CTA / nav targets.
 * Keep in sync with dashboard card links and Header.
 */
const EXPECTED_CTAS = {
  "View full timeline": "#updates",
  "View all updates": "#updates",
  "See affected areas": "#needs",
  "See more ways to help": "#help",
  "See full funding details": "#impact",
  "Donate Now": "#help",
  "About our data": "#impact",
} as const;

describe("Phase 2 CTA map", () => {
  it("wires primary nav to the six section anchors", () => {
    expect(PRIMARY_NAV.map((item) => item.href)).toEqual([
      "#overview",
      "#updates",
      "#needs",
      "#response",
      "#impact",
      "#help",
    ]);
  });

  it("documents dashboard CTA targets for regression", () => {
    expect(EXPECTED_CTAS["View full timeline"]).toBe("#updates");
    expect(EXPECTED_CTAS["See affected areas"]).toBe("#needs");
    expect(EXPECTED_CTAS["Donate Now"]).toBe("#help");
    expect(EXPECTED_CTAS["See full funding details"]).toBe("#impact");
  });
});
