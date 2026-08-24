import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "hc_admin_session";
const SESSION_SALT = "hc-admin-session-v1";

export function getAdminSecret(): string | null {
  const secret = process.env.ADMIN_SECRET?.trim();
  return secret || null;
}

export function deriveAdminSessionToken(secret: string): string {
  return createHmac("sha256", secret).update(SESSION_SALT).digest("base64url");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function isValidAdminSessionToken(
  token: string | null | undefined,
): boolean {
  const secret = getAdminSecret();
  if (!secret || !token) {
    return false;
  }
  return timingSafeStringEqual(token, deriveAdminSessionToken(secret));
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${ADMIN_SESSION_COOKIE}=`)) {
      return decodeURIComponent(trimmed.slice(ADMIN_SESSION_COOKIE.length + 1));
    }
  }

  return null;
}

function authorizeAdminBearer(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization");
  if (!header) {
    return false;
  }
  const expected = `Bearer ${secret}`;
  return timingSafeStringEqual(header, expected);
}

/**
 * Authorize admin API routes via session cookie or Bearer ADMIN_SECRET.
 */
export function authorizeAdminRequest(request: Request): boolean {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  if (authorizeAdminBearer(request, secret)) {
    return true;
  }

  return isValidAdminSessionToken(getSessionTokenFromRequest(request));
}

/**
 * Metrics import accepts cron or admin credentials.
 */
export function authorizeAdminOrCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const header = request.headers.get("authorization");
    if (header && timingSafeStringEqual(header, `Bearer ${cronSecret}`)) {
      return true;
    }
  }

  return authorizeAdminRequest(request);
}

export function adminSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
