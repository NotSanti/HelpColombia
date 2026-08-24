import type { DonationDestinationRecord } from "@/lib/security/donation-destination";

/**
 * Fixture destinations for local/offline mode (mirrors supabase/seed.sql).
 * Keyed by organization slug — same identifiers used by /out/[organizationId].
 */
export const donationDestinationFixtureBySlug: Record<
  string,
  DonationDestinationRecord
> = {
  "colombian-red-cross": {
    destinationUrl: "https://www.cruzrojacolombiana.org/",
    approvedHostname: "www.cruzrojacolombiana.org",
    verificationStatus: "verified",
    isEnabled: true,
  },
  unicef: {
    destinationUrl: "https://www.unicef.org/",
    approvedHostname: "www.unicef.org",
    verificationStatus: "verified",
    isEnabled: true,
  },
  wfp: {
    destinationUrl: "https://www.wfp.org/",
    approvedHostname: "www.wfp.org",
    verificationStatus: "verified",
    isEnabled: true,
  },
  "direct-relief": {
    destinationUrl: "https://www.directrelief.org/",
    approvedHostname: "www.directrelief.org",
    verificationStatus: "verified",
    isEnabled: true,
  },
};
