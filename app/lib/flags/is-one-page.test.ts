import { describe, expect, it } from "vitest";
import { isOnePage, parseIsOnePageFlag } from "@/lib/flags/is-one-page";

describe("isOnePage flag", () => {
  it("defaults to false", () => {
    expect(parseIsOnePageFlag(undefined)).toBe(false);
    expect(parseIsOnePageFlag("")).toBe(false);
    expect(isOnePage({})).toBe(false);
  });

  it("accepts true/1/yes case-insensitively", () => {
    expect(parseIsOnePageFlag("true")).toBe(true);
    expect(parseIsOnePageFlag("TRUE")).toBe(true);
    expect(parseIsOnePageFlag("1")).toBe(true);
    expect(parseIsOnePageFlag("yes")).toBe(true);
  });

  it("rejects other values", () => {
    expect(parseIsOnePageFlag("false")).toBe(false);
    expect(parseIsOnePageFlag("0")).toBe(false);
    expect(parseIsOnePageFlag("no")).toBe(false);
  });

  it("reads NEXT_PUBLIC_IS_ONE_PAGE or IS_ONE_PAGE", () => {
    expect(isOnePage({ NEXT_PUBLIC_IS_ONE_PAGE: "true" })).toBe(true);
    expect(isOnePage({ IS_ONE_PAGE: "1" })).toBe(true);
    expect(
      isOnePage({ NEXT_PUBLIC_IS_ONE_PAGE: "false", IS_ONE_PAGE: "true" }),
    ).toBe(false);
  });
});
