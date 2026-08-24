import { describe, expect, it } from "vitest";
import {
  type DonationDestinationRecord,
  validateDonationDestination,
} from "@/lib/security/donation-destination";

const validBase: DonationDestinationRecord = {
  destinationUrl: "https://www.cruzrojacolombiana.org/",
  approvedHostname: "www.cruzrojacolombiana.org",
  verificationStatus: "verified",
  isEnabled: true,
};

describe("validateDonationDestination", () => {
  it("accepts a valid verified HTTPS destination", () => {
    const result = validateDonationDestination(validBase);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url.href).toBe("https://www.cruzrojacolombiana.org/");
      expect(result.url.hostname).toBe("www.cruzrojacolombiana.org");
    }
  });

  it("rejects unverified destinations", () => {
    const result = validateDonationDestination({
      ...validBase,
      verificationStatus: "pending",
    });
    expect(result).toEqual({ ok: false, reason: "unverified" });
  });

  it("rejects disabled destinations", () => {
    const result = validateDonationDestination({
      ...validBase,
      isEnabled: false,
    });
    expect(result).toEqual({ ok: false, reason: "disabled" });
  });

  it("rejects malformed URLs", () => {
    const result = validateDonationDestination({
      ...validBase,
      destinationUrl: "not a url",
    });
    expect(result).toEqual({ ok: false, reason: "malformed_url" });
  });

  it("rejects http URLs", () => {
    const result = validateDonationDestination({
      ...validBase,
      destinationUrl: "http://www.cruzrojacolombiana.org/",
      approvedHostname: "www.cruzrojacolombiana.org",
    });
    expect(result).toEqual({ ok: false, reason: "http_url" });
  });

  it("rejects credentials in the URL", () => {
    const result = validateDonationDestination({
      ...validBase,
      destinationUrl: "https://user:pass@www.cruzrojacolombiana.org/",
    });
    expect(result).toEqual({ ok: false, reason: "credentials_present" });
  });

  it("rejects unexpected ports", () => {
    const result = validateDonationDestination({
      ...validBase,
      destinationUrl: "https://www.cruzrojacolombiana.org:8443/",
    });
    expect(result).toEqual({ ok: false, reason: "unexpected_port" });
  });

  it("rejects hostname mismatch with exact equality", () => {
    const result = validateDonationDestination({
      ...validBase,
      destinationUrl: "https://evil.example/cruzrojacolombiana.org/",
      approvedHostname: "www.cruzrojacolombiana.org",
    });
    expect(result).toEqual({ ok: false, reason: "hostname_mismatch" });
  });

  it("rejects lookalike hostnames that only contain the approved host", () => {
    const result = validateDonationDestination({
      ...validBase,
      destinationUrl: "https://www.cruzrojacolombiana.org.evil.com/",
      approvedHostname: "www.cruzrojacolombiana.org",
    });
    expect(result).toEqual({ ok: false, reason: "hostname_mismatch" });
  });

  it("does not trust substring hostname matches", () => {
    const result = validateDonationDestination({
      ...validBase,
      destinationUrl: "https://not-www.cruzrojacolombiana.org/",
      approvedHostname: "www.cruzrojacolombiana.org",
    });
    expect(result).toEqual({ ok: false, reason: "hostname_mismatch" });
  });
});
