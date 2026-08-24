import { isIP } from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

export type DnsLookupFn = (
  hostname: string,
  options?: { all?: boolean; verbatim?: boolean },
) => Promise<
  | { address: string; family: number }
  | Array<{ address: string; family: number }>
>;

export const DONATION_HEALTH_MAX_REDIRECTS = 5;
export const DONATION_HEALTH_TIMEOUT_MS = 10_000;
export const DONATION_HEALTH_MAX_RESPONSE_BYTES = 65_536;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export type DonationHealthCheckInput = {
  destinationUrl: string;
  approvedHostname: string;
};

export type DonationHealthFailureReason =
  | "malformed_url"
  | "http_url"
  | "credentials_present"
  | "unexpected_port"
  | "hostname_mismatch"
  | "private_destination"
  | "dns_failure"
  | "timeout"
  | "too_many_redirects"
  | "redirect_hostname_mismatch"
  | "response_too_large"
  | "unexpected_status"
  | "fetch_error";

export type DonationHealthCheckResult =
  | {
      ok: true;
      finalUrl: string;
      redirectCount: number;
      statusCode: number;
    }
  | {
      ok: false;
      reason: DonationHealthFailureReason;
      detail?: string;
      disableDestination: boolean;
    };

export type DonationHealthCheckOptions = {
  fetchImpl?: typeof fetch;
  lookupImpl?: DnsLookupFn;
  maxRedirects?: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
};

function failure(
  reason: DonationHealthFailureReason,
  detail: string | undefined,
  disableDestination: boolean,
): DonationHealthCheckResult {
  return { ok: false, reason, detail, disableDestination };
}

/**
 * Reject private, loopback, link-local, and other non-public destinations.
 */
export function isBlockedIpAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }

  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice("::ffff:".length);
      if (isIP(mapped) === 4) return isBlockedIpAddress(mapped);
    }
    return false;
  }

  return true;
}

function validateHttpsUrl(
  rawUrl: string,
  approvedHostname: string,
):
  | { ok: true; url: URL }
  | { ok: false; reason: DonationHealthFailureReason; detail?: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "malformed_url" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "http_url" };
  }

  if (url.username !== "" || url.password !== "") {
    return { ok: false, reason: "credentials_present" };
  }

  if (url.port !== "") {
    return { ok: false, reason: "unexpected_port" };
  }

  if (url.hostname !== approvedHostname) {
    return {
      ok: false,
      reason: "hostname_mismatch",
      detail: `expected ${approvedHostname}, got ${url.hostname}`,
    };
  }

  return { ok: true, url };
}

/**
 * Resolve hostname and reject if any address is private/blocked.
 */
export async function resolvePublicHostname(
  hostname: string,
  lookupImpl: DnsLookupFn = dnsLookup as DnsLookupFn,
): Promise<{ ok: true } | { ok: false; detail: string }> {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return { ok: false, detail: "localhost blocked" };
  }

  const literalIp = isIP(hostname);
  if (literalIp) {
    if (isBlockedIpAddress(hostname)) {
      return { ok: false, detail: `blocked literal IP ${hostname}` };
    }
    return { ok: true };
  }

  try {
    const results = await lookupImpl(hostname, { all: true, verbatim: true });
    const entries = Array.isArray(results) ? results : [results];
    if (!entries.length) {
      return { ok: false, detail: "no DNS records" };
    }
    for (const entry of entries) {
      if (isBlockedIpAddress(entry.address)) {
        return {
          ok: false,
          detail: `${hostname} resolves to blocked ${entry.address}`,
        };
      }
    }
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "DNS lookup failed";
    return { ok: false, detail: message };
  }
}

async function readLimitedBody(
  response: Response,
  maxBytes: number,
): Promise<{ ok: true } | { ok: false; reason: "response_too_large" }> {
  const reader = response.body?.getReader();
  if (!reader) return { ok: true };

  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "response_too_large" };
      }
    }
  } finally {
    reader.releaseLock();
  }
  return { ok: true };
}

function resolveRedirectLocation(
  currentUrl: URL,
  locationHeader: string | null,
): URL | null {
  if (!locationHeader?.trim()) return null;
  try {
    return new URL(locationHeader.trim(), currentUrl);
  } catch {
    return null;
  }
}

/**
 * Server-side health probe for a verified donation destination.
 * Follows redirects manually; each hop must stay on the approved hostname.
 */
export async function checkDonationDestinationHealth(
  input: DonationHealthCheckInput,
  options: DonationHealthCheckOptions = {},
): Promise<DonationHealthCheckResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const lookupImpl = options.lookupImpl ?? dnsLookup;
  const maxRedirects = options.maxRedirects ?? DONATION_HEALTH_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DONATION_HEALTH_TIMEOUT_MS;
  const maxResponseBytes =
    options.maxResponseBytes ?? DONATION_HEALTH_MAX_RESPONSE_BYTES;

  const validated = validateHttpsUrl(
    input.destinationUrl,
    input.approvedHostname,
  );
  if (!validated.ok) {
    return failure(
      validated.reason,
      validated.detail,
      validated.reason === "hostname_mismatch",
    );
  }

  const dns = await resolvePublicHostname(
    validated.url.hostname,
    lookupImpl,
  );
  if (!dns.ok) {
    return failure("dns_failure", dns.detail, false);
  }

  let currentUrl = validated.url;
  let redirectCount = 0;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const hopDns = await resolvePublicHostname(currentUrl.hostname, lookupImpl);
    if (!hopDns.ok) {
      return failure("dns_failure", hopDns.detail, false);
    }

    let response: Response;
    try {
      response = await fetchImpl(currentUrl.toString(), {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: "*/*",
          "User-Agent": "HelpColombia-DonationHealth/1.0",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "fetch failed";
      const reason = /timeout|aborted/i.test(message)
        ? "timeout"
        : "fetch_error";
      return failure(reason, message, false);
    }

    if (REDIRECT_STATUSES.has(response.status)) {
      redirectCount += 1;
      if (redirectCount > maxRedirects) {
        return failure(
          "too_many_redirects",
          `exceeded ${maxRedirects} redirects`,
          true,
        );
      }

      const nextUrl = resolveRedirectLocation(
        currentUrl,
        response.headers.get("location"),
      );
      if (!nextUrl) {
        return failure(
          "fetch_error",
          "redirect missing or invalid Location header",
          true,
        );
      }

      const nextValidated = validateHttpsUrl(
        nextUrl.toString(),
        input.approvedHostname,
      );
      if (!nextValidated.ok) {
        return failure(
          nextValidated.reason === "hostname_mismatch"
            ? "redirect_hostname_mismatch"
            : nextValidated.reason,
          nextValidated.detail ??
            `redirect to ${nextUrl.hostname} is not allowed`,
          true,
        );
      }

      currentUrl = nextValidated.url;
      continue;
    }

    // Some servers reject HEAD — retry once with GET on the same URL.
    if (response.status === 405 || response.status === 501) {
      try {
        response = await fetchImpl(currentUrl.toString(), {
          method: "GET",
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            Accept: "*/*",
            "User-Agent": "HelpColombia-DonationHealth/1.0",
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "fetch failed";
        const reason = /timeout|aborted/i.test(message)
          ? "timeout"
          : "fetch_error";
        return failure(reason, message, false);
      }

      if (REDIRECT_STATUSES.has(response.status)) {
        redirectCount += 1;
        if (redirectCount > maxRedirects) {
          return failure(
            "too_many_redirects",
            `exceeded ${maxRedirects} redirects`,
            true,
          );
        }
        const nextUrl = resolveRedirectLocation(
          currentUrl,
          response.headers.get("location"),
        );
        if (!nextUrl) {
          return failure(
            "fetch_error",
            "redirect missing or invalid Location header",
            true,
          );
        }
        const nextValidated = validateHttpsUrl(
          nextUrl.toString(),
          input.approvedHostname,
        );
        if (!nextValidated.ok) {
          return failure(
            nextValidated.reason === "hostname_mismatch"
              ? "redirect_hostname_mismatch"
              : nextValidated.reason,
            nextValidated.detail ??
              `redirect to ${nextUrl.hostname} is not allowed`,
            true,
          );
        }
        currentUrl = nextValidated.url;
        continue;
      }
    }

    const bodyLimit = await readLimitedBody(response, maxResponseBytes);
    if (!bodyLimit.ok) {
      return failure("response_too_large", undefined, false);
    }

    if (response.status >= 200 && response.status < 400) {
      return {
        ok: true,
        finalUrl: currentUrl.toString(),
        redirectCount,
        statusCode: response.status,
      };
    }

    return failure(
      "unexpected_status",
      `HTTP ${response.status}`,
      response.status >= 400 && response.status < 500 ? false : true,
    );
  }

  return failure(
    "too_many_redirects",
    `exceeded ${maxRedirects} redirects`,
    true,
  );
}

/**
 * Whether an unhealthy result should disable the public donation CTA.
 */
export function shouldDisableDonationDestination(
  result: DonationHealthCheckResult,
): boolean {
  return !result.ok && result.disableDestination;
}
