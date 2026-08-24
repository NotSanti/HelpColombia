import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  type DonationDestinationRecord,
  type DonationValidationFailureReason,
  validateDonationDestination,
} from "@/lib/security/donation-destination";
import { donationDestinationFixtureBySlug } from "@/lib/fixtures/donation-destinations";

export type ResolveDonationResult =
  | { ok: true; url: URL }
  | {
      ok: false;
      reason: "not_found" | DonationValidationFailureReason;
    };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

async function loadDestinationByOrganizationId(
  organizationId: string,
): Promise<DonationDestinationRecord | null> {
  if (!isSupabaseConfigured()) {
    return donationDestinationFixtureBySlug[organizationId] ?? null;
  }

  const supabase = await createClient();

  const { data: bySlug, error: slugError } = await supabase
    .from("organizations")
    .select("id, slug, active")
    .eq("active", true)
    .eq("slug", organizationId)
    .maybeSingle();

  if (slugError) {
    return null;
  }

  let organization = bySlug;

  if (!organization && isUuid(organizationId)) {
    const { data: byId, error: idError } = await supabase
      .from("organizations")
      .select("id, slug, active")
      .eq("active", true)
      .eq("id", organizationId)
      .maybeSingle();

    if (idError) {
      return null;
    }
    organization = byId;
  }

  if (!organization) {
    return null;
  }

  const { data: destination, error: destError } = await supabase
    .from("donation_destinations")
    .select(
      "destination_url, approved_hostname, verification_status, is_enabled",
    )
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (destError || !destination) {
    return null;
  }

  return {
    destinationUrl: destination.destination_url,
    approvedHostname: destination.approved_hostname,
    verificationStatus: destination.verification_status,
    isEnabled: destination.is_enabled,
  };
}

/**
 * Resolve an organization identifier to a validated HTTPS redirect URL.
 * `organizationId` is the org slug (preferred) or UUID.
 */
export async function resolveDonationRedirect(
  organizationId: string,
): Promise<ResolveDonationResult> {
  const trimmed = organizationId.trim();
  if (!trimmed) {
    return { ok: false, reason: "not_found" };
  }

  const record = await loadDestinationByOrganizationId(trimmed);
  if (!record) {
    return { ok: false, reason: "not_found" };
  }

  const validated = validateDonationDestination(record);
  if (!validated.ok) {
    return validated;
  }

  return { ok: true, url: validated.url };
}
