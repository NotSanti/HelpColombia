import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  authorizeAdminOrCronRequest,
  authorizeAdminRequest,
  deriveAdminSessionToken,
  getSessionTokenFromRequest,
  isValidAdminSessionToken,
} from "@/lib/admin/auth";

describe("admin auth", () => {
  const originalAdmin = process.env.ADMIN_SECRET;
  const originalCron = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.ADMIN_SECRET = "admin-test-secret";
    process.env.CRON_SECRET = "cron-test-secret";
  });

  afterEach(() => {
    process.env.ADMIN_SECRET = originalAdmin;
    process.env.CRON_SECRET = originalCron;
  });

  it("derives a stable session token", () => {
    const token = deriveAdminSessionToken("admin-test-secret");
    expect(token).toBeTruthy();
    expect(isValidAdminSessionToken(token)).toBe(true);
  });

  it("rejects invalid session tokens", () => {
    expect(isValidAdminSessionToken("wrong")).toBe(false);
    expect(isValidAdminSessionToken(null)).toBe(false);
  });

  it("authorizes bearer admin secret", () => {
    const request = new Request("http://localhost/api/admin/overview", {
      headers: { authorization: "Bearer admin-test-secret" },
    });
    expect(authorizeAdminRequest(request)).toBe(true);
  });

  it("authorizes session cookie", () => {
    const token = deriveAdminSessionToken("admin-test-secret");
    const request = new Request("http://localhost/api/admin/overview", {
      headers: {
        cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
      },
    });
    expect(authorizeAdminRequest(request)).toBe(true);
    expect(getSessionTokenFromRequest(request)).toBe(token);
  });

  it("accepts cron bearer for admin-or-cron routes", () => {
    const request = new Request("http://localhost/api/admin/metrics/import", {
      headers: { authorization: "Bearer cron-test-secret" },
    });
    expect(authorizeAdminOrCronRequest(request)).toBe(true);
  });
});
