import { createServiceClient } from "@/lib/supabase/admin";
import {
  checkDonationDestinationHealth,
  shouldDisableDonationDestination,
  type DonationHealthCheckResult,
  type DnsLookupFn,
} from "@/lib/security/donation-health-check";
import type { Database } from "@/types/database";

type DonationDestinationUpdate =
  Database["public"]["Tables"]["donation_destinations"]["Update"];

export type DonationHealthRow = {
  id: string;
  organization_id: string;
  destination_url: string;
  approved_hostname: string;
  verification_status: string;
  is_enabled: boolean;
};

export type DonationHealthCheckSummary = {
  destinationId: string;
  organizationId: string;
  ok: boolean;
  healthStatus: "healthy" | "unhealthy";
  disabled: boolean;
  needsReview: boolean;
  detail?: string;
};

export type IngestDonationHealthResult = {
  ok: true;
  checked: number;
  healthy: number;
  unhealthy: number;
  disabled: number;
  results: DonationHealthCheckSummary[];
};

export type IngestDonationHealthFailure = {
  ok: false;
  stage: "config" | "fetch" | "persist";
  message: string;
};

function formatHealthDetail(result: DonationHealthCheckResult): string | null {
  if (result.ok) {
    return `HTTP ${result.statusCode}; ${result.redirectCount} redirect(s)`;
  }
  return result.detail
    ? `${result.reason}: ${result.detail}`
    : result.reason;
}

/**
 * Probe verified donation destinations and persist health audit fields.
 * May disable CTAs on unexpected redirect/host changes — never auto-verifies.
 */
export async function ingestDonationHealth(options?: {
  fetchImpl?: typeof fetch;
  lookupImpl?: DnsLookupFn;
}): Promise<IngestDonationHealthResult | IngestDonationHealthFailure> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      ok: false,
      stage: "config",
      message: "Missing Supabase service-role configuration",
    };
  }

  try {
    const supabase = createServiceClient();
    const { data: destinations, error } = await supabase
      .from("donation_destinations")
      .select(
        "id, organization_id, destination_url, approved_hostname, verification_status, is_enabled",
      )
      .eq("verification_status", "verified");

    if (error) {
      return { ok: false, stage: "fetch", message: error.message };
    }

    const rows = (destinations ?? []) as DonationHealthRow[];
    const checkedAt = new Date().toISOString();
    const summaries: DonationHealthCheckSummary[] = [];
    let healthy = 0;
    let unhealthy = 0;
    let disabled = 0;

    for (const row of rows) {
      const result = await checkDonationDestinationHealth(
        {
          destinationUrl: row.destination_url,
          approvedHostname: row.approved_hostname,
        },
        {
          fetchImpl: options?.fetchImpl,
          lookupImpl: options?.lookupImpl,
        },
      );

      const isHealthy = result.ok;
      if (isHealthy) healthy += 1;
      else unhealthy += 1;

      const disable = shouldDisableDonationDestination(result);
      const needsReview = !isHealthy && disable;
      const healthDetail = formatHealthDetail(result);

      const updatePayload: DonationDestinationUpdate = {
        last_checked_at: checkedAt,
        health_status: isHealthy ? "healthy" : "unhealthy",
        health_detail: healthDetail,
      };

      if (isHealthy) {
        updatePayload.needs_review = false;
      } else {
        updatePayload.last_health_error_at = checkedAt;
        if (disable) {
          updatePayload.is_enabled = false;
          updatePayload.needs_review = true;
          disabled += 1;
        }
      }

      const { error: updateError } = await supabase
        .from("donation_destinations")
        .update(updatePayload)
        .eq("id", row.id);

      if (updateError) {
        console.error(
          "[ingestDonationHealth] persist failed",
          row.id,
          updateError,
        );
        return { ok: false, stage: "persist", message: updateError.message };
      }

      summaries.push({
        destinationId: row.id,
        organizationId: row.organization_id,
        ok: isHealthy,
        healthStatus: isHealthy ? "healthy" : "unhealthy",
        disabled: disable,
        needsReview,
        detail: healthDetail ?? undefined,
      });
    }

    return {
      ok: true,
      checked: rows.length,
      healthy,
      unhealthy,
      disabled,
      results: summaries,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected health check failure";
    console.error("[ingestDonationHealth] unexpected", message);
    return { ok: false, stage: "persist", message };
  }
}
