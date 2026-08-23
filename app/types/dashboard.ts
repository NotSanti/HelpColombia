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
};

export type KeyFigure = {
  id: string;
  label: string;
  detail?: string;
  value: string;
  tone: "severe" | "info" | "high" | "low";
};

export type OrganizationHelp = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  websiteUrl: string;
  websiteLabel: string;
  accent: "severe" | "info" | "high";
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
};

export type RegionImpact = {
  id: string;
  name: string;
  severity: Severity;
  deaths: string;
  affected: string;
};

export type DashboardData = {
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
