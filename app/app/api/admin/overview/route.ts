import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/auth";
import { getAdminOverview } from "@/lib/admin/overview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overview = await getAdminOverview();
    return NextResponse.json(overview);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load overview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
