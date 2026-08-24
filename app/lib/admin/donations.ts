import { z } from "zod";
import type { Json } from "@/types/database";
import { logAdminAction } from "@/lib/admin/audit";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type DonationUpdate =
  Database["public"]["Tables"]["donation_destinations"]["Update"];

export type AdminDonationRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  destinationUrl: string;
  approvedHostname: string;
  verificationStatus: string;
  isEnabled: boolean;
  healthStatus: string;
  healthDetail: string | null;
  needsReview: boolean;
  lastCheckedAt: string | null;
  verifiedAt: string | null;
};

export const donationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("verify") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("enable") }),
  z.object({ action: z.literal("disable") }),
  z.object({ action: z.literal("clear_review") }),
]);

export type DonationAction = z.infer<typeof donationActionSchema>;

export async function listDonationsForAdmin(): Promise<AdminDonationRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("donation_destinations")
    .select(
      `
      id,
      organization_id,
      destination_url,
      approved_hostname,
      verification_status,
      is_enabled,
      health_status,
      health_detail,
      needs_review,
      last_checked_at,
      verified_at,
      organizations ( name )
    `,
    )
    .order("needs_review", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const org = row.organizations as { name: string } | null;
    return {
      id: row.id,
      organizationId: row.organization_id,
      organizationName: org?.name ?? "Unknown",
      destinationUrl: row.destination_url,
      approvedHostname: row.approved_hostname,
      verificationStatus: row.verification_status,
      isEnabled: row.is_enabled,
      healthStatus: row.health_status,
      healthDetail: row.health_detail,
      needsReview: row.needs_review,
      lastCheckedAt: row.last_checked_at,
      verifiedAt: row.verified_at,
    };
  });
}

function buildDonationUpdate(action: DonationAction): DonationUpdate {
  const now = new Date().toISOString();

  switch (action.action) {
    case "verify":
      return {
        verification_status: "verified",
        verified_at: now,
        is_enabled: true,
        needs_review: false,
      };
    case "reject":
      return {
        verification_status: "rejected",
        is_enabled: false,
        needs_review: false,
      };
    case "enable":
      return { is_enabled: true };
    case "disable":
      return { is_enabled: false };
    case "clear_review":
      return { needs_review: false };
    default:
      return {};
  }
}

export type ApplyDonationActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function applyDonationAction(
  destinationId: string,
  action: DonationAction,
): Promise<ApplyDonationActionResult> {
  const supabase = createServiceClient();

  if (action.action === "enable") {
    const { data: existing, error: fetchError } = await supabase
      .from("donation_destinations")
      .select("verification_status")
      .eq("id", destinationId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { ok: false, message: fetchError?.message ?? "Destination not found" };
    }

    if (existing.verification_status !== "verified") {
      return {
        ok: false,
        message: "Only verified destinations can be enabled",
      };
    }
  }

  const update = buildDonationUpdate(action);
  const { error } = await supabase
    .from("donation_destinations")
    .update(update)
    .eq("id", destinationId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logAdminAction({
    action: `donation.${action.action}`,
    entityType: "donation_destination",
    entityId: destinationId,
    payload: update as Json,
  });

  return { ok: true };
}
