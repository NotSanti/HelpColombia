import { describe, expect, it } from "vitest";
import { authorizeCronRequest } from "@/lib/ingestion/cron-auth";

describe("authorizeCronRequest", () => {
  it("rejects when CRON_SECRET is unset", () => {
    const prev = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    const request = new Request("http://localhost/api/cron/reliefweb", {
      headers: { Authorization: "Bearer anything" },
    });
    expect(authorizeCronRequest(request)).toBe(false);
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  });

  it("accepts matching Bearer token", () => {
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-secret-value";
    const request = new Request("http://localhost/api/cron/reliefweb", {
      headers: { Authorization: "Bearer test-secret-value" },
    });
    expect(authorizeCronRequest(request)).toBe(true);
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  });

  it("rejects wrong token", () => {
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "test-secret-value";
    const request = new Request("http://localhost/api/cron/reliefweb", {
      headers: { Authorization: "Bearer other" },
    });
    expect(authorizeCronRequest(request)).toBe(false);
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  });
});
