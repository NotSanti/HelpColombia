import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  authorizeAdminRequest,
  deriveAdminSessionToken,
  getAdminSecret,
} from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = getAdminSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Admin access is not configured (ADMIN_SECRET missing)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : null;

  if (!password || password !== secret) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = deriveAdminSessionToken(secret);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());

  await logAdminAction({
    action: "admin.login",
    entityType: "session",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!authorizeAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  });

  await logAdminAction({
    action: "admin.logout",
    entityType: "session",
  });

  return NextResponse.json({ ok: true });
}
