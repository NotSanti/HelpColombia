export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { assertProductionEnv } = await import("@/lib/env/production");
  assertProductionEnv();
}
