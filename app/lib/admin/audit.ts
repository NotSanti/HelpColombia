import { createServiceClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type AdminAuditEntry = {
  action: string;
  entityType: string;
  entityId?: string;
  payload?: Json;
};

export async function logAdminAction(entry: AdminAuditEntry): Promise<void> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("[logAdminAction] missing Supabase config");
    return;
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("admin_audit_log").insert({
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    payload: entry.payload ?? null,
  });

  if (error) {
    console.error("[logAdminAction] persist failed", error.message);
  }
}

export async function listRecentAdminAudit(limit = 50) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("id, action, entity_type, entity_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
