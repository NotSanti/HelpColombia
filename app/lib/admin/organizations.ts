import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { createServiceClient } from "@/lib/supabase/admin";

export type AdminOrganizationRow = {
  id: string;
  name: string;
  shortDescription: string | null;
  active: boolean;
  sortOrder: number;
};

export const organizationPatchSchema = z.object({
  shortDescription: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
});

export async function listOrganizationsForAdmin(): Promise<AdminOrganizationRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, short_description, active, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    active: row.active,
    sortOrder: row.sort_order,
  }));
}

export async function patchOrganization(
  organizationId: string,
  patch: z.infer<typeof organizationPatchSchema>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = createServiceClient();
  const update: {
    short_description?: string | null;
    active?: boolean;
  } = {};

  if (patch.shortDescription !== undefined) {
    update.short_description = patch.shortDescription;
  }
  if (patch.active !== undefined) {
    update.active = patch.active;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, message: "No fields to update" };
  }

  const { error } = await supabase
    .from("organizations")
    .update(update)
    .eq("id", organizationId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await logAdminAction({
    action: "organization.update",
    entityType: "organization",
    entityId: organizationId,
    payload: update,
  });

  return { ok: true };
}
