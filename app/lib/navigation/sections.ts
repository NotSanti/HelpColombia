export const SECTION_IDS = [
  "overview",
  "updates",
  "needs",
  "response",
  "impact",
  "help",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export type NavItem = {
  href: `#${SectionId}`;
  label: string;
  sectionId: SectionId;
};

/** Primary header navigation — Milestone 13. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "#overview", label: "Overview", sectionId: "overview" },
  { href: "#updates", label: "Updates", sectionId: "updates" },
  { href: "#needs", label: "Who Needs Help", sectionId: "needs" },
  { href: "#response", label: "Who Is Helping", sectionId: "response" },
  { href: "#impact", label: "Impact", sectionId: "impact" },
  { href: "#help", label: "How to Help", sectionId: "help" },
];

export const SECTION_PLACEHOLDERS: Array<{
  id: Exclude<SectionId, "overview">;
  title: string;
  description: string;
}> = [
  {
    id: "updates",
    title: "Updates",
    description: "Expanded chronological updates will appear here.",
  },
  {
    id: "needs",
    title: "Who Needs Help",
    description: "Regional humanitarian needs will appear here.",
  },
  {
    id: "response",
    title: "Who Is Helping",
    description: "Organizations and response activity will appear here.",
  },
  {
    id: "impact",
    title: "Impact",
    description: "Detailed impact figures and trends will appear here.",
  },
  {
    id: "help",
    title: "How to Help",
    description: "Verified ways to help will appear here.",
  },
];
