/**
 * Feature flag: overview-only mode (hide Phase 2 expanded sections + nav).
 *
 * Env: NEXT_PUBLIC_IS_ONE_PAGE=true|1|yes
 * Default: false (full one-page with #updates…#help).
 */
export function parseIsOnePageFlag(
  value: string | undefined | null,
): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isOnePage(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return parseIsOnePageFlag(
    env.NEXT_PUBLIC_IS_ONE_PAGE ?? env.IS_ONE_PAGE,
  );
}
