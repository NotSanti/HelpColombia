import type { NormalizedFundingFlow } from "@/lib/sources/fts";
import type { FundingSector, FundingTotalItem } from "@/types/dashboard";

const SECTOR_COLORS = [
  "#EF3340",
  "#FF681D",
  "#FFB000",
  "#169BFF",
  "#6B7C8F",
] as const;

/** Collapse verbose FTS cluster names into dashboard buckets when possible. */
export function mapSectorLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return "Other";
  const value = raw.toLowerCase();
  if (value.includes("shelter") || value.includes("nfi") || value.includes("cccm")) {
    return "Shelter";
  }
  if (value.includes("food") || value.includes("nutrition")) {
    return "Food";
  }
  if (value.includes("health")) {
    return "Health";
  }
  if (value.includes("wash") || value.includes("water") || value.includes("hygiene")) {
    return "WASH";
  }
  if (value.includes("protection") || value.includes("protección")) {
    return "Protection";
  }
  return raw.trim().split(/[:/]/)[0]?.trim() || "Other";
}

export function formatUsdCompact(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export type FundingAggregates = {
  totals: FundingTotalItem[];
  sectors: FundingSector[];
  sums: {
    pledged: number;
    committed: number;
    received: number;
    unknown: number;
  };
};

/**
 * Aggregate normalized flows into FundingCard totals + sector shares.
 * Does not invent amounts for missing statuses.
 */
export function aggregateFundingFlows(
  flows: NormalizedFundingFlow[],
): FundingAggregates {
  const sums = {
    pledged: 0,
    committed: 0,
    received: 0,
    unknown: 0,
  };

  const sectorTotals = new Map<string, number>();

  for (const flow of flows) {
    sums[flow.status] += flow.amountUsd;
    const label = mapSectorLabel(flow.sector);
    sectorTotals.set(label, (sectorTotals.get(label) ?? 0) + flow.amountUsd);
  }

  const knownTotal = sums.pledged + sums.committed + sums.received;
  const sectorEntries = [...sectorTotals.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);

  const top = sectorEntries.slice(0, 4);
  const rest = sectorEntries.slice(4);
  const restSum = rest.reduce((acc, [, amount]) => acc + amount, 0);
  if (restSum > 0) {
    top.push(["Other", (top.find(([n]) => n === "Other")?.[1] ?? 0) + restSum]);
  }

  // Dedupe Other if we merged into existing Other bucket awkwardly
  const merged = new Map<string, number>();
  for (const [name, amount] of top) {
    merged.set(name, (merged.get(name) ?? 0) + amount);
  }

  const displaySectors = [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sectorSum = displaySectors.reduce((acc, [, amount]) => acc + amount, 0);
  const sectors: FundingSector[] = displaySectors.map(([name, amount], index) => {
    const percent =
      sectorSum > 0 ? Math.max(1, Math.round((amount / sectorSum) * 100)) : 0;
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
      percent,
      color: SECTOR_COLORS[index % SECTOR_COLORS.length],
    };
  });

  // Normalize percents to ~100 without inventing sectors
  const percentSum = sectors.reduce((acc, s) => acc + s.percent, 0);
  if (sectors.length > 0 && percentSum !== 100) {
    sectors[0].percent += 100 - percentSum;
  }

  const totals: FundingTotalItem[] = [
    {
      id: "pledged",
      label: "Pledged",
      value: formatUsdCompact(sums.pledged),
      detail:
        sums.pledged > 0
          ? "Reported as pledge in OCHA FTS"
          : "No pledge flows in current FTS pull",
      tone: "low",
    },
    {
      id: "committed",
      label: "Committed",
      value: formatUsdCompact(sums.committed),
      detail:
        sums.committed > 0
          ? "Reported as commitment in OCHA FTS"
          : "No commitment flows in current FTS pull",
      tone: "info",
    },
    {
      id: "received",
      label: "Received",
      value: formatUsdCompact(sums.received),
      detail:
        sums.received > 0
          ? "Reported as paid in OCHA FTS"
          : "No paid flows in current FTS pull",
      tone: "moderate",
    },
  ];

  void knownTotal;

  return { totals, sectors, sums };
}
