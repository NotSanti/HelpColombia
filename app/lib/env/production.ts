/**
 * Production environment validation — server-only.
 * Called from instrumentation on startup when NODE_ENV=production.
 */

export type ProductionEnvIssue = {
  code: string;
  message: string;
};

const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
] as const;

/**
 * Validate production secrets and guard against service-role exposure in public env.
 */
export function validateProductionEnv(
  env: NodeJS.ProcessEnv = process.env,
): ProductionEnvIssue[] {
  if (env.NODE_ENV !== "production") {
    return [];
  }

  const issues: ProductionEnvIssue[] = [];

  for (const key of REQUIRED_IN_PRODUCTION) {
    if (!env[key]?.trim()) {
      issues.push({
        code: "missing_env",
        message: `Missing required production env: ${key}`,
      });
    }
  }

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith("NEXT_PUBLIC_") || !value) continue;
    if (/service.?role|secret|private/i.test(key) || /service.?role/i.test(value)) {
      issues.push({
        code: "public_secret_leak",
        message: `Suspicious secret-like value in public env var ${key}`,
      });
    }
  }

  if (env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    issues.push({
      code: "service_role_public",
      message:
        "SUPABASE service role must not use NEXT_PUBLIC_ prefix — use SUPABASE_SERVICE_ROLE_KEY server-side only",
    });
  }

  return issues;
}

export function assertProductionEnv(
  env: NodeJS.ProcessEnv = process.env,
): void {
  const issues = validateProductionEnv(env);
  if (issues.length === 0) return;
  const detail = issues.map((i) => i.message).join("; ");
  throw new Error(`Production environment validation failed: ${detail}`);
}
