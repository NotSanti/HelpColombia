import { describe, expect, it, vi } from "vitest";
import {
  checkDonationDestinationHealth,
  isBlockedIpAddress,
  resolvePublicHostname,
  shouldDisableDonationDestination,
  DONATION_HEALTH_MAX_REDIRECTS,
  type DnsLookupFn,
} from "@/lib/security/donation-health-check";

const publicLookup: DnsLookupFn = async () => [
  { address: "93.184.216.34", family: 4 },
];

describe("isBlockedIpAddress", () => {
  it("blocks loopback and RFC1918 ranges", () => {
    expect(isBlockedIpAddress("127.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("10.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("192.168.1.1")).toBe(true);
    expect(isBlockedIpAddress("169.254.0.1")).toBe(true);
    expect(isBlockedIpAddress("::1")).toBe(true);
    expect(isBlockedIpAddress("fe80::1")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isBlockedIpAddress("8.8.8.8")).toBe(false);
    expect(isBlockedIpAddress("1.1.1.1")).toBe(false);
  });
});

describe("resolvePublicHostname", () => {
  it("rejects localhost without DNS", async () => {
    const result = await resolvePublicHostname("localhost");
    expect(result.ok).toBe(false);
  });

  it("rejects DNS answers that resolve to private space", async () => {
    const lookupImpl: DnsLookupFn = async () => [
      { address: "127.0.0.1", family: 4 },
    ];
    const result = await resolvePublicHostname("example.com", lookupImpl);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.detail).toContain("127.0.0.1");
    }
  });

  it("accepts public DNS answers", async () => {
    const result = await resolvePublicHostname("example.com", publicLookup);
    expect(result.ok).toBe(true);
  });
});

describe("checkDonationDestinationHealth", () => {
  const baseInput = {
    destinationUrl: "https://www.example.org/donate",
    approvedHostname: "www.example.org",
  };

  it("rejects http URLs", async () => {
    const result = await checkDonationDestinationHealth({
      ...baseInput,
      destinationUrl: "http://www.example.org/donate",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("http_url");
      expect(result.disableDestination).toBe(false);
    }
  });

  it("rejects stored hostname mismatch before fetch", async () => {
    const result = await checkDonationDestinationHealth({
      destinationUrl: "https://evil.example/donate",
      approvedHostname: "www.example.org",
    });
    expect(result).toMatchObject({
      ok: false,
      reason: "hostname_mismatch",
      disableDestination: true,
    });
  });

  it("follows redirects only when hostname stays on the allowlist", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("https://www.example.org/a")) {
        return new Response(null, {
          status: 302,
          headers: { Location: "https://www.example.org/b" },
        });
      }
      if (url.startsWith("https://www.example.org/b")) {
        return new Response(null, { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const result = await checkDonationDestinationHealth(
      { ...baseInput, destinationUrl: "https://www.example.org/a" },
      { fetchImpl: fetchImpl as typeof fetch, lookupImpl: publicLookup },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.redirectCount).toBe(1);
      expect(result.finalUrl).toBe("https://www.example.org/b");
    }
  });

  it("disables on redirect to an unexpected host", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { Location: "https://evil.example/phish" },
      }),
    );
    const result = await checkDonationDestinationHealth(baseInput, {
      fetchImpl: fetchImpl as typeof fetch,
      lookupImpl: publicLookup,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "redirect_hostname_mismatch",
      disableDestination: true,
    });
    expect(shouldDisableDonationDestination(result)).toBe(true);
  });

  it("enforces redirect limit without following blindly", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(null, {
        status: 302,
        headers: { Location: "https://www.example.org/loop" },
      }),
    );
    const result = await checkDonationDestinationHealth(baseInput, {
      fetchImpl: fetchImpl as typeof fetch,
      lookupImpl: publicLookup,
      maxRedirects: 2,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "too_many_redirects",
      disableDestination: true,
    });
    expect(fetchImpl.mock.calls.length).toBeLessThanOrEqual(
      DONATION_HEALTH_MAX_REDIRECTS + 2,
    );
  });

  it("rejects oversized responses", async () => {
    const body = new Uint8Array(100);
    const fetchImpl = vi.fn(async () => new Response(body, { status: 200 }));
    const result = await checkDonationDestinationHealth(baseInput, {
      fetchImpl: fetchImpl as typeof fetch,
      lookupImpl: publicLookup,
      maxResponseBytes: 32,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "response_too_large",
      disableDestination: false,
    });
  });
});
