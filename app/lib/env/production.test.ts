import { describe, expect, it } from "vitest";
import {
  assertProductionEnv,
  validateProductionEnv,
} from "@/lib/env/production";

describe("validateProductionEnv", () => {
  it("skips validation outside production", () => {
    expect(validateProductionEnv({ NODE_ENV: "development" })).toEqual([]);
  });

  it("requires core production env vars", () => {
    const issues = validateProductionEnv({
      NODE_ENV: "production",
    });
    expect(issues.some((i) => i.code === "missing_env")).toBe(true);
  });

  it("rejects public service-role env names", () => {
    const issues = validateProductionEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "secret",
      CRON_SECRET: "cron",
      NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "leaked",
    });
    expect(issues.some((i) => i.code === "service_role_public")).toBe(true);
  });

  it("passes with valid production env", () => {
    const env = {
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "secret",
      CRON_SECRET: "cron",
    } as NodeJS.ProcessEnv;
    expect(validateProductionEnv(env)).toEqual([]);
    expect(() => assertProductionEnv(env)).not.toThrow();
  });
});
