import { describe, expect, it } from "vitest";
import {
  PRIMARY_NAV,
  SECTION_IDS,
  SECTION_PLACEHOLDERS,
} from "@/lib/navigation/sections";

describe("navigation sections", () => {
  it("covers the Phase 2 anchor set", () => {
    expect([...SECTION_IDS]).toEqual([
      "overview",
      "updates",
      "needs",
      "response",
      "impact",
      "help",
    ]);
  });

  it("maps primary nav labels to the required targets", () => {
    expect(PRIMARY_NAV.map((item) => [item.label, item.href])).toEqual([
      ["Overview", "#overview"],
      ["Updates", "#updates"],
      ["Who Needs Help", "#needs"],
      ["Who Is Helping", "#response"],
      ["Impact", "#impact"],
      ["How to Help", "#help"],
    ]);
  });

  it("provides placeholders for every non-overview section", () => {
    expect(SECTION_PLACEHOLDERS.map((s) => s.id)).toEqual([
      "updates",
      "needs",
      "response",
      "impact",
      "help",
    ]);
  });
});
