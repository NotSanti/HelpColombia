import { NextResponse } from "next/server";
import { authorizeCronRequest } from "@/lib/ingestion/cron-auth";
import { ingestSgcSeismic } from "@/lib/ingestion/sgc-seismic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Scheduled SGC seismic ingestion.
 * Requires Authorization: Bearer $CRON_SECRET.
 * Upstream failures do not overwrite existing disaster metadata.
 */
export async function GET(request: Request) {
  if (!authorizeCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await ingestSgcSeismic();

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
    primaryEventId: result.primaryEventId,
    magnitude: result.magnitude,
    aftershockCount: result.aftershockCount,
  });
}
