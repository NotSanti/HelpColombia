"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { DataFreshnessBanner } from "@/components/dashboard/DataFreshnessBanner";
import { SectionPlaceholders } from "@/components/dashboard/SectionPlaceholders";
import { UpdatesSection } from "@/components/dashboard/UpdatesSection";
import { NeedsSection } from "@/components/dashboard/NeedsSection";
import { ResponseSection } from "@/components/dashboard/ResponseSection";
import type { MapController } from "@/components/map/ColombiaMap";
import {
  MapChrome,
  MapLoadingOverlay,
  MapVignette,
} from "@/components/map/MapBackground";
import { mapPublicUrls } from "@/lib/fixtures/map-design";

const ColombiaMap = dynamic(
  () =>
    import("@/components/map/ColombiaMap").then((mod) => ({
      default: mod.ColombiaMap,
    })),
  { ssr: false },
);

/** Warm HTTP cache for style sources before MapLibre mounts. */
function prefetchMapAssets() {
  const urls = [
    mapPublicUrls.departments,
    mapPublicUrls.neighbors,
    mapPublicUrls.impactRegions,
    mapPublicUrls.markers,
    mapPublicUrls.labels,
    mapPublicUrls.epicenter,
  ];
  for (const url of urls) {
    void fetch(url, { priority: "low" } as RequestInit).catch(() => {});
  }
}

export function DashboardShell({ data }: { data: DashboardData }) {
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopOverlayVisible, setDesktopOverlayVisible] = useState(true);
  const [desktopOverlayFading, setDesktopOverlayFading] = useState(false);
  const [mobileOverlayVisible, setMobileOverlayVisible] = useState(true);
  const [mobileOverlayFading, setMobileOverlayFading] = useState(false);
  const mapControllerRef = useRef<MapController | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    prefetchMapAssets();
  }, []);

  const selectedRegion = useMemo(
    () => data.regions.find((r) => r.id === selectedRegionId) ?? null,
    [data.regions, selectedRegionId],
  );

  const handleMapReady = useCallback((controller: MapController) => {
    mapControllerRef.current = controller;
  }, []);

  const handleDesktopMapFullyLoaded = useCallback(() => {
    setDesktopOverlayFading(true);
    window.setTimeout(() => setDesktopOverlayVisible(false), 550);
  }, []);

  const handleMobileMapFullyLoaded = useCallback(() => {
    setMobileOverlayFading(true);
    window.setTimeout(() => setMobileOverlayVisible(false), 550);
  }, []);

  const selectRegion = useCallback((regionId: string) => {
    setSelectedRegionId(regionId);
    mapControllerRef.current?.focusRegion(regionId);
  }, []);

  const mapProps = {
    regions: data.regions,
    selectedRegionId,
    hoveredRegionId,
    onSelectRegion: setSelectedRegionId,
    onHoverRegion: setHoveredRegionId,
    onReady: handleMapReady,
    epicenter:
      data.earthquake.latitude != null && data.earthquake.longitude != null
        ? {
            latitude: data.earthquake.latitude,
            longitude: data.earthquake.longitude,
            magnitude: data.earthquake.magnitude,
          }
        : null,
  };

  return (
    <div className="relative min-h-dvh bg-background">
      <Header />
      <DataFreshnessBanner
        mode={data.dataMode}
        lastUpdatedLabel={data.liveStatus.lastUpdatedLabel}
        className="relative z-30"
      />

      <main id="main-content">
        <section
          id="overview"
          aria-label="Overview dashboard"
          className="relative flex h-[calc(100dvh-4rem)] min-h-[32rem] flex-col overflow-hidden scroll-mt-section"
        >
          {/*
            Paint with the cards on xl (CSS), not after the JS media-query flip.
            MapLibre mounts underneath; overlay fades when the map is fully ready.
          */}
          <div className="pointer-events-none absolute inset-0 z-0 hidden xl:block">
            {desktopOverlayVisible ? (
              <MapLoadingOverlay
                fading={desktopOverlayFading}
                onFadedOut={() => setDesktopOverlayVisible(false)}
              />
            ) : null}
          </div>

          {isDesktop ? (
            <>
              <ColombiaMap
                {...mapProps}
                showLoadingOverlay={false}
                onFullyLoaded={handleDesktopMapFullyLoaded}
              />
              <MapVignette />
            </>
          ) : null}

          <div className="relative flex min-h-0 flex-1 flex-col pointer-events-none">
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {selectedRegion
                ? `Selected region ${selectedRegion.name}. Impact ${selectedRegion.severity}. Deaths ${selectedRegion.deaths}. People affected ${selectedRegion.affected}.`
                : "No region selected."}
            </div>

            <section className="sr-only" aria-label="Affected regions summary">
              <h2>Affected regions</h2>
              <ul>
                {data.regions.map((region) => (
                  <li key={region.id}>
                    <button type="button" onClick={() => selectRegion(region.id)}>
                      {region.name}: {region.severity} impact, {region.deaths}{" "}
                      deaths, {region.affected} affected
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Mobile / tablet stacked flow */}
            <div className="pointer-events-auto relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 py-4 xl:hidden">
              <LiveUpdateCard data={data.liveStatus} />
              <section
                aria-label="Impact map of Colombia"
                className="relative h-56 overflow-hidden rounded-[10px] border border-border sm:h-72"
              >
                {mobileOverlayVisible ? (
                  <MapLoadingOverlay
                    fading={mobileOverlayFading}
                    onFadedOut={() => setMobileOverlayVisible(false)}
                    className="z-[1]"
                  />
                ) : null}
                {!isDesktop ? (
                  <ColombiaMap
                    {...mapProps}
                    layout="contained"
                    showLoadingOverlay={false}
                    onFullyLoaded={handleMobileMapFullyLoaded}
                  />
                ) : null}
                <MapChrome
                  variant="legend"
                  className="absolute right-3 bottom-3 z-10 h-auto w-[122px]"
                />
              </section>
              <WhatHappenedCard data={data.earthquake} />
              <KeyFiguresCard figures={data.keyFigures} />
              <HelpCard organizations={data.organizations} />
              <FundingCard totals={data.fundingTotals} sectors={data.sectors} />
              <LiveUpdatesCard updates={data.liveUpdates} />
              <RegionalImpactPanel
                regions={data.regions}
                selectedRegionId={selectedRegionId}
                hoveredRegionId={hoveredRegionId}
                onSelectRegion={selectRegion}
                onHoverRegion={setHoveredRegionId}
              />
            </div>

            {/* Desktop: 3 columns + full-width bottom.
                pointer-events-none so empty map areas stay draggable; cards re-enable hit testing. */}
            <div className="pointer-events-none relative z-10 hidden min-h-0 flex-1 flex-col gap-3 overflow-hidden px-2 pt-3 pb-px xl:flex">
              <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(290px,0.95fr)_minmax(0,1.45fr)_minmax(340px,1fr)] gap-3 overflow-hidden">
                <aside className="pointer-events-auto flex min-h-0 flex-col gap-2.5 overflow-visible">
                  <div className="flex min-h-0 max-w-[calc(16rem+0.75rem+34px)] flex-[1.2] items-stretch gap-3">
                    <LiveUpdateCard
                      data={data.liveStatus}
                      className="min-h-0 max-w-[16rem] flex-1 overflow-y-auto"
                    />
                    <MapChrome
                      variant="zoom"
                      className="h-[68px] w-[34px] shrink-0 self-start"
                      onZoomIn={() => mapControllerRef.current?.zoomIn()}
                      onZoomOut={() => mapControllerRef.current?.zoomOut()}
                    />
                  </div>
                  <WhatHappenedCard
                    data={data.earthquake}
                    className="min-h-0 max-w-[20rem] flex-[0.95] overflow-y-auto"
                  />
                  <KeyFiguresCard
                    figures={data.keyFigures}
                    className="min-h-0 max-w-[20rem] flex-[1.35] overflow-y-auto"
                  />
                </aside>

                <div className="pointer-events-none relative flex min-h-0 flex-col overflow-hidden">
                  <div className="pointer-events-auto relative z-10 mt-auto w-full max-w-[760px] self-center pb-0.5">
                    <LiveUpdatesCard updates={data.liveUpdates} />
                  </div>
                </div>

                <aside className="pointer-events-auto flex min-h-0 flex-col items-end gap-2.5 overflow-visible">
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
                className="pointer-events-auto relative z-10 shrink-0"
                selectedRegionId={selectedRegionId}
                hoveredRegionId={hoveredRegionId}
                onSelectRegion={selectRegion}
                onHoverRegion={setHoveredRegionId}
              />
            </div>
          </div>
        </section>

        <UpdatesSection updates={data.liveUpdates} dataMode={data.dataMode} />
        <NeedsSection
          regions={data.regions}
          selectedRegionId={selectedRegionId}
          onSelectRegion={selectRegion}
        />
        <ResponseSection organizations={data.organizations} />
        <SectionPlaceholders />
      </main>

      <Footer className="relative z-30" dataSources={data.dataSources} />
    </div>
  );
}
