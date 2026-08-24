import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/ingestion/cron-auth";
import { ingestDonationHealth } from "@/lib/ingestion/donation-health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Scheduled donation destination health checks.
 * Requires Authorization: Bearer $CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ingestDonationHealth();
  if (!result.ok) {
    const status =
      result.stage === "config" ? 503 : result.stage === "fetch" ? 502 : 500;
    return NextResponse.json(
      { ok: false, stage: result.stage, error: result.message },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    checked: result.checked,
    healthy: result.healthy,
    unhealthy: result.unhealthy,
    disabled: result.disabled,
  });
}
