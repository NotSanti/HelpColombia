export type Severity = "severe" | "high" | "moderate" | "low";

export type LiveStatus = {
  headline: string;
  summary: string;
  lastUpdatedLabel: string;
  isLive: boolean;
};

export type EarthquakeFacts = {
  magnitude: number;
  occurredAtLabel: string;
  timeLabel: string;
  epicenter: string;
  depthKm: number;
  aftershocksLabel: string;
  /** WGS84 — drives live map epicenter when present */
  latitude: number | null;
  longitude: number | null;
};

export type KeyFigure = {
  id: string;
  label: string;
  detail?: string;
  value: string;
  tone: "severe" | "info" | "high" | "low";
  /** Provenance for the selected observation */
  sourceName?: string;
  reportedAtLabel?: string;
};

export type OrganizationHelpMetric = {
  label: string;
  value: string;
  sourceName: string;
};

export type OrganizationHelp = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  websiteUrl: string;
  websiteLabel: string;
  accent: "severe" | "info" | "high";
  /** Sourced numeric claims only — never AI-inferred */
  metrics?: OrganizationHelpMetric[];
  opsUpdateLabel?: string;
};

export type FundingTotalItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "low" | "info" | "moderate";
};

export type FundingSector = {
  id: string;
  name: string;
  percent: number;
  color: string;
};

export type LiveUpdateItem = {
  id: string;
  source: string;
  title: string;
  relativeTime: string;
  accent: "info" | "high" | "severe";
  /** Plain-text summary when available — never raw upstream HTML. */
  summary?: string | null;
  sourceUrl?: string | null;
  /** Absolute timestamp label for expanded feed. */
  publishedAtLabel?: string | null;
  /** ISO retrieved_at for staleness checks. */
  retrievedAt?: string | null;
};

export type RegionImpact = {
  id: string;
  name: string;
  severity: Severity;
  deaths: string;
  affected: string;
  /** Only set when a sourced value exists — never estimated. */
  injured?: string | null;
  displaced?: string | null;
  sourceName?: string;
  sourceNames?: string[];
  lastUpdatedLabel?: string | null;
};

export type DashboardDataMode = "live" | "fixture" | "degraded";

export type DashboardData = {
  dataMode: DashboardDataMode;
  liveStatus: LiveStatus;
  earthquake: EarthquakeFacts;
  keyFigures: KeyFigure[];
  organizations: OrganizationHelp[];
  fundingTotals: FundingTotalItem[];
  sectors: FundingSector[];
  liveUpdates: LiveUpdateItem[];
  regions: RegionImpact[];
  dataSources: string[];
};
