/**
 * Server-side donation destination validation.
 * Frontend must never supply or trust an arbitrary destination URL.
 */

export type DonationDestinationRecord = {
  destinationUrl: string;
  approvedHostname: string;
  verificationStatus: string;
  isEnabled: boolean;
};

export type DonationValidationFailureReason =
  | "unverified"
  | "disabled"
  | "malformed_url"
  | "http_url"
  | "credentials_present"
  | "unexpected_port"
  | "hostname_mismatch";

export type DonationValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: DonationValidationFailureReason };

/**
 * Validate a stored donation destination before redirecting.
 * Hostname comparison is exact equality only — never includes/startsWith.
 */
export function validateDonationDestination(
  record: DonationDestinationRecord,
): DonationValidationResult {
  if (record.verificationStatus !== "verified") {
    return { ok: false, reason: "unverified" };
  }

  if (!record.isEnabled) {
    return { ok: false, reason: "disabled" };
  }

  let url: URL;
  try {
    url = new URL(record.destinationUrl);
  } catch {
    return { ok: false, reason: "malformed_url" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "http_url" };
  }

  if (url.username !== "" || url.password !== "") {
    return { ok: false, reason: "credentials_present" };
  }

  // Reject non-default ports (URL.port is "" for default 443 on https).
  if (url.port !== "") {
    return { ok: false, reason: "unexpected_port" };
  }

  if (url.hostname !== record.approvedHostname) {
    return { ok: false, reason: "hostname_mismatch" };
  }

  return { ok: true, url };
}
