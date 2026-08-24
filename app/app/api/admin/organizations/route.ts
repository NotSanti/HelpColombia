import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/auth";
import { listOrganizationsForAdmin } from "@/lib/admin/organizations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!authorizeAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const organizations = await listOrganizationsForAdmin();
    return NextResponse.json({ organizations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load organizations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
