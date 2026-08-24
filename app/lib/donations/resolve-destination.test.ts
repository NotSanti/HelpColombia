import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveDonationRedirect } from "@/lib/donations/resolve-destination";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: () => false,
  createClient: vi.fn(),
}));

describe("resolveDonationRedirect (fixture mode)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a known organization slug to HTTPS", async () => {
    const result = await resolveDonationRedirect("colombian-red-cross");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url.protocol).toBe("https:");
      expect(result.url.hostname).toBe("www.cruzrojacolombiana.org");
    }
  });

  it("returns not_found for an unknown organization", async () => {
    const result = await resolveDonationRedirect("unknown-org");
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("returns not_found for an empty organization id", async () => {
    const result = await resolveDonationRedirect("   ");
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});
