import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/auth";
import { listDonationsForAdmin } from "@/lib/admin/donations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const donations = await listDonationsForAdmin();
    return NextResponse.json({ donations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load donations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
