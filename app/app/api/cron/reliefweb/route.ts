import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/ingestion/cron-auth";
import { ingestReliefWebUpdates } from "@/lib/ingestion/reliefweb-updates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Scheduled ReliefWeb updates ingestion.
 * Requires Authorization: Bearer $CRON_SECRET.
 * Upstream failures do not delete existing updates.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ingestReliefWebUpdates();

  if (!result.ok) {
    const status =
      result.stage === "config" ? 503 : result.stage === "fetch" ? 502 : 500;
    return NextResponse.json(
      {
        ok: false,
        stage: result.stage,
        error: result.message,
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    fetched: result.fetched,
    upserted: result.upserted,
  });
}
