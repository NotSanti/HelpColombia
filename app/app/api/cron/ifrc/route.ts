import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/ingestion/cron-auth";
import { ingestIfrcOperations } from "@/lib/ingestion/ifrc-operations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Scheduled IFRC GO operations ingestion.
 * Requires Authorization: Bearer $CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ingestIfrcOperations();
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
    externalEventId: result.externalEventId,
    appealCode: result.appealCode,
    targetPopulation: result.targetPopulation,
    peopleReached: result.peopleReached,
    opsUpdatesUpserted: result.opsUpdatesUpserted,
  });
}
