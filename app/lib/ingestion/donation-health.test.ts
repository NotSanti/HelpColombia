import { describe, expect, it, vi, beforeEach } from "vitest";
import type { DnsLookupFn } from "@/lib/security/donation-health-check";

const update = vi.fn(async (_payload: Record<string, unknown>) => ({ error: null }));

const destinationRow = {
  id: "dest-1",
  organization_id: "org-1",
  destination_url: "https://www.example.org/",
  approved_hostname: "www.example.org",
  verification_status: "verified",
  is_enabled: true,
};

vi.mock("@/lib/supabase/admin", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table !== "donation_destinations") {
        throw new Error(`unexpected table ${table}`);
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({
            data: [destinationRow],
            error: null,
          })),
        })),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: vi.fn(async () => {
            update(payload);
            return { error: null };
          }),
        })),
      };
    },
  }),
}));

import { ingestDonationHealth } from "@/lib/ingestion/donation-health";

describe("ingestDonationHealth", () => {
  beforeEach(() => {
    update.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
  });

  it("never auto-verifies and disables on redirect mismatch", async () => {
    const lookupImpl: DnsLookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
    ];
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { Location: "https://evil.example/" },
      }),
    );

    const result = await ingestDonationHealth({
      fetchImpl: fetchImpl as typeof fetch,
      lookupImpl,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.disabled).toBe(1);
      expect(result.results[0]?.needsReview).toBe(true);
    }

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        is_enabled: false,
        needs_review: true,
        health_status: "unhealthy",
      }),
    );

    const payload = update.mock.calls[0]?.[0];
    expect(payload).toBeDefined();
    if (!payload) return;
    expect(payload).not.toHaveProperty("verification_status");
    expect(payload).not.toHaveProperty("approved_hostname");
    expect(payload).not.toHaveProperty("destination_url");
  });
});
