-- =============================================================================
-- Help Colombia — cleanup seed / demo data for the published disaster
-- Disaster id: 22222222-2222-4222-8222-222222222201
-- Slug:        colombia-earthquake-2025-08-17  (kept for URL stability)
--
-- Run in Supabase SQL editor AFTER reviewing. This DELETES demo rows.
-- Then import real metrics via /admin or POST /api/admin/metrics/import
-- using scripts/examples/ungrd-metrics-import-2026-08-10.json
-- =============================================================================

begin;

-- 1) Align disaster copy with the real primary event (SGC + UNGRD framing).
--    Seismic cron may still overwrite magnitude/epicenter from the latest
--    monitored quake; pin SEISMIC_PRIMARY_EVENT_ID in env if you want a fixed map.
update public.disaster_events
set
  name = 'Colombia Earthquake — August 10, 2026',
  headline = 'Colombia Earthquake Emergency',
  summary = 'A magnitude 7.4 earthquake struck San José del Palmar, Chocó on August 10, 2026, with ongoing aftershock activity across the Pacific region. Official impact figures are updated from UNGRD and partner sources.',
  occurred_at = '2026-08-10T12:34:00+00', -- 07:34 America/Bogota
  epicenter_label = 'San José del Palmar, Chocó',
  magnitude = 7.4,
  depth_km = 96,
  aftershocks_label = '47+ aftershocks recorded',
  updated_at = now()
where id = '22222222-2222-4222-8222-222222222201';

-- 2) Remove seed + demo impact observations (including conflicting media tally
--    and example admin imports that used placeholder UNGRD numbers).
delete from public.impact_metrics
where disaster_id = '22222222-2222-4222-8222-222222222201';

-- 3) Remove seed Live Updates (external_id seed-*).
--    Real ReliefWeb rows (when RELIEFWEB_APP_NAME is set) will not match this pattern.
delete from public.updates
where disaster_id = '22222222-2222-4222-8222-222222222201'
  and (
    external_id like 'seed-%'
    or title in (
      'Providing clean water and hygiene kits in Chocó communities',
      'Delivered food rations to shelters serving 2,000+ people',
      'Rescue and medical response continuing in hardest-hit areas'
    )
  );

-- 4) Clear inflated seed region tallies until department-level UNGRD rows exist.
--    Severity can stay as a rough UI cue; numeric displays go to null/"—".
update public.regions
set
  deaths = null,
  affected_count = null,
  injured = null,
  displaced = null,
  deaths_display = null,
  affected_display = null,
  updated_at = now()
where disaster_id = '22222222-2222-4222-8222-222222222201';

commit;

-- Optional verification:
-- select count(*) from impact_metrics where disaster_id = '22222222-2222-4222-8222-222222222201';
-- select count(*) from updates where disaster_id = '22222222-2222-4222-8222-222222222201';
-- select name, magnitude, epicenter_label, occurred_at from disaster_events where id = '22222222-2222-4222-8222-222222222201';
