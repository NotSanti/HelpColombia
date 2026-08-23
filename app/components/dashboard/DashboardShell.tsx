import type { DashboardData } from "@/types/dashboard";
import { Header } from "@/components/dashboard/Header";
import { LiveUpdateCard } from "@/components/dashboard/LiveUpdateCard";
import { WhatHappenedCard } from "@/components/dashboard/WhatHappenedCard";
import { KeyFiguresCard } from "@/components/dashboard/KeyFiguresCard";
import { HelpCard } from "@/components/dashboard/HelpCard";
import { FundingCard } from "@/components/dashboard/FundingCard";
import { LiveUpdatesCard } from "@/components/dashboard/LiveUpdatesCard";
import { RegionalImpactPanel } from "@/components/dashboard/RegionalImpactPanel";
import { Footer } from "@/components/dashboard/Footer";
import {
  MapBackground,
  MapChrome,
  MapRegion,
} from "@/components/map/MapBackground";

export function DashboardShell({ data }: { data: DashboardData }) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {/* Full-bleed map so navbar/footer glass matches card transparency */}
      <MapBackground className="hidden xl:block" />

      <Header className="relative z-30 shrink-0" />

      {/* Mobile / tablet stacked flow */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-4 xl:hidden">
        <LiveUpdateCard data={data.liveStatus} />
        <MapRegion />
        <WhatHappenedCard data={data.earthquake} />
        <KeyFiguresCard figures={data.keyFigures} />
        <HelpCard organizations={data.organizations} />
        <FundingCard totals={data.fundingTotals} sectors={data.sectors} />
        <LiveUpdatesCard updates={data.liveUpdates} />
        <RegionalImpactPanel regions={data.regions} />
      </div>

      {/* Desktop: 3 columns + full-width bottom — flex/grid scales with viewport */}
      <div className="relative z-10 hidden min-h-0 flex-1 flex-col gap-3 overflow-hidden px-2 pt-3 pb-px xl:flex">
        <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(290px,0.95fr)_minmax(0,1.45fr)_minmax(340px,1fr)] gap-3 overflow-hidden">
          {/* Left column */}
          <aside className="flex min-h-0 flex-col gap-2.5 overflow-visible">
            <div className="flex min-h-0 max-w-[calc(16rem+0.75rem+34px)] flex-[1.6] items-stretch gap-3">
              <LiveUpdateCard
                data={data.liveStatus}
                className="min-h-0 max-w-[16rem] flex-1 overflow-y-auto"
              />
              <MapChrome
                variant="zoom"
                className="h-[68px] w-[34px] shrink-0 self-start"
              />
            </div>
            <WhatHappenedCard
              data={data.earthquake}
              className="min-h-0 max-w-[20rem] flex-[0.95] overflow-y-auto"
            />
            <KeyFiguresCard
              figures={data.keyFigures}
              className="min-h-0 max-w-[20rem] flex-[1.05] overflow-y-auto"
            />
          </aside>

          {/* Middle column */}
          <div className="relative flex min-h-0 flex-col overflow-hidden">
            <div className="relative z-10 mt-auto w-full max-w-[760px] self-center pb-0.5">
              <LiveUpdatesCard updates={data.liveUpdates} />
            </div>
          </div>

          {/* Right column */}
          <aside className="flex min-h-0 flex-col items-end gap-2.5 overflow-visible">
            <div className="flex min-h-0 w-full max-w-[calc(20rem+0.75rem+122px)] flex-[1.4] items-stretch justify-end gap-3">
              <MapChrome
                variant="legend"
                className="h-[206px] w-[122px] shrink-0 self-start"
              />
              <HelpCard
                organizations={data.organizations}
                className="h-full min-h-0 w-full max-w-[20rem] flex-1 overflow-hidden"
              />
            </div>
            <FundingCard
              totals={data.fundingTotals}
              sectors={data.sectors}
              className="min-h-0 w-full max-w-[20rem] overflow-y-auto"
            />
          </aside>
        </div>

        <RegionalImpactPanel
          regions={data.regions}
          className="relative z-10 shrink-0"
        />
      </div>

      <Footer className="relative z-30 shrink-0" dataSources={data.dataSources} />
    </div>
  );
}
