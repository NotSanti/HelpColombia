import type { Database } from "@/types/database";

export type TrustTier = Database["public"]["Enums"]["trust_tier"];

/**
 * Higher score = preferred when resolving conflicting impact metrics.
 * Colombian official authorities outrank other "official" sources.
 */
export function sourcePriorityScore(input: {
  trustTier: TrustTier | string | null | undefined;
  sourceName: string | null | undefined;
}): number {
  const name = (input.sourceName ?? "").toLowerCase();
  const tier = (input.trustTier ?? "other") as string;

  const isColombianOfficial =
    name.includes("ungrd") ||
    name.includes("unidad nacional") ||
    name.includes("gestion del riesgo") ||
    name.includes("sgc") ||
    name.includes("servicio geológico") ||
    name.includes("servicio geologico");

  if (isColombianOfficial) return 100;
  if (tier === "official") return 80;
  if (tier === "humanitarian") return 60;
  if (tier === "verified_media") return 40;
  return 20;
}
