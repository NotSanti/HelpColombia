import { NextResponse } from "next/server";
import { authorizeAdminOrCronRequest } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { importStructuredImpactMetrics } from "@/lib/metrics/import-structured-metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Manual/structured impact metrics import (append-only).
 * Auth: Authorization: Bearer $CRON_SECRET or admin session / Bearer $ADMIN_SECRET
 * Body: Zod-validated JSON (see ungrdMetricsImportSchema).
 */
export async function POST(request: Request) {
  if (!authorizeAdminOrCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await importStructuredImpactMetrics(body);
  if (!result.ok) {
    const status =
      result.stage === "validate"
        ? 400
        : result.stage === "config"
          ? 503
          : 500;
    return NextResponse.json(
      { ok: false, stage: result.stage, error: result.message },
      { status },
    );
  }

  await logAdminAction({
    action: "metrics.import",
    entityType: "impact_metrics",
    entityId: result.disasterId,
    payload: {
      inserted: result.inserted,
      sourceId: result.sourceId,
    },
  });

  return NextResponse.json({
    ok: true,
    inserted: result.inserted,
    disasterId: result.disasterId,
    sourceId: result.sourceId,
  });
}
