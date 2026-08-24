-- Seed data for Help Colombia Milestone 3 dashboard.
-- Safe to re-run: uses fixed IDs / ON CONFLICT where possible.

insert into public.sources (id, name, source_type, base_url, trust_tier, active)
values
  ('11111111-1111-4111-8111-111111111101', 'UN OCHA', 'agency', 'https://www.unocha.org/', 'official', true),
  ('11111111-1111-4111-8111-111111111102', 'UNGRD', 'agency', 'https://portal.gestiondelriesgo.gov.co/', 'official', true),
  ('11111111-1111-4111-8111-111111111103', 'IFRC', 'agency', 'https://www.ifrc.org/', 'humanitarian', true),
  ('11111111-1111-4111-8111-111111111104', 'WFP', 'agency', 'https://www.wfp.org/', 'humanitarian', true),
  ('11111111-1111-4111-8111-111111111105', 'UNICEF', 'agency', 'https://www.unicef.org/', 'humanitarian', true),
  ('11111111-1111-4111-8111-111111111106', 'ReliefWeb', 'aggregator', 'https://reliefweb.int/', 'humanitarian', true),
  ('11111111-1111-4111-8111-111111111107', 'Colombian Red Cross', 'agency', 'https://www.cruzrojacolombiana.org/', 'humanitarian', true),
  ('11111111-1111-4111-8111-111111111108', 'Example News', 'media', 'https://example.com/', 'verified_media', true)
on conflict (name) do update
set
  source_type = excluded.source_type,
  base_url = excluded.base_url,
  trust_tier = excluded.trust_tier,
  active = excluded.active;

insert into public.disaster_events (
  id,
  slug,
  name,
  event_type,
  status,
  occurred_at,
  latitude,
  longitude,
  magnitude,
  depth_km,
  epicenter_label,
  aftershocks_label,
  headline,
  summary
)
values (
  '22222222-2222-4222-8222-222222222201',
  'colombia-earthquake-2025-08-17',
  'Colombia Earthquake — August 17, 2025',
  'earthquake',
  'published',
  '2025-08-17T17:04:00Z',
  5.92,
  -77.42,
  6.1,
  30,
  '27 km NW of Nuquí, Chocó',
  '120+ aftershocks recorded',
  'Colombia Needs Us Now',
  'A 6.1 magnitude earthquake struck Colombia on August 17, 2025, affecting communities and infrastructure across multiple regions. Thousands need our help.'
)
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  occurred_at = excluded.occurred_at,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  magnitude = excluded.magnitude,
  depth_km = excluded.depth_km,
  epicenter_label = excluded.epicenter_label,
  aftershocks_label = excluded.aftershocks_label,
  headline = excluded.headline,
  summary = excluded.summary,
  updated_at = now();

-- Append-only metrics: clear seed rows for this disaster then insert once.
delete from public.impact_metrics
where disaster_id = '22222222-2222-4222-8222-222222222201';

insert into public.impact_metrics (
  disaster_id,
  metric_type,
  value,
  unit,
  display_value,
  detail,
  department,
  source_id,
  reported_at
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    'deaths',
    312,
    'count',
    '312+',
    'Confirmed',
    null,
    '11111111-1111-4111-8111-111111111102',
    '2025-08-18T12:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222201',
    'injured',
    2140,
    'count',
    '2,140+',
    'Across regions',
    null,
    '11111111-1111-4111-8111-111111111102',
    '2025-08-18T12:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222201',
    'affected',
    68400,
    'count',
    '68,400+',
    'Estimated',
    null,
    '11111111-1111-4111-8111-111111111101',
    '2025-08-18T12:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222201',
    'displaced',
    24000,
    'count',
    '24,000+',
    'From their homes',
    null,
    '11111111-1111-4111-8111-111111111101',
    '2025-08-18T12:00:00Z'
  ),
  -- Conflicting media observation (resolver must NOT average / prefer this).
  (
    '22222222-2222-4222-8222-222222222201',
    'deaths',
    450,
    'count',
    '450',
    'Unconfirmed media tally',
    null,
    '11111111-1111-4111-8111-111111111108',
    '2025-08-19T08:00:00Z'
  ),
  (
    '22222222-2222-4222-8222-222222222201',
    'deaths',
    128,
    'count',
    '128+',
    'Department total',
    'Chocó',
    '11111111-1111-4111-8111-111111111102',
    '2025-08-18T12:00:00Z'
  );

insert into public.regions (
  id,
  disaster_id,
  name,
  department_code,
  severity,
  deaths,
  affected_count,
  deaths_display,
  affected_display
)
values
  (
    'choco',
    '22222222-2222-4222-8222-222222222201',
    'Chocó',
    'CHO',
    'severe',
    128,
    38200,
    '128+',
    '38,200+'
  ),
  (
    'risaralda',
    '22222222-2222-4222-8222-222222222201',
    'Risaralda',
    'RIS',
    'high',
    61,
    14200,
    '61+',
    '14,200+'
  ),
  (
    'antioquia',
    '22222222-2222-4222-8222-222222222201',
    'Antioquia',
    'ANT',
    'high',
    54,
    12800,
    '54+',
    '12,800+'
  ),
  (
    'valle',
    '22222222-2222-4222-8222-222222222201',
    'Valle del Cauca',
    'VAC',
    'moderate',
    29,
    11100,
    '29+',
    '11,100+'
  ),
  (
    'cauca',
    '22222222-2222-4222-8222-222222222201',
    'Cauca',
    'CAU',
    'moderate',
    20,
    7900,
    '20+',
    '7,900+'
  )
on conflict (id) do update
set
  disaster_id = excluded.disaster_id,
  name = excluded.name,
  department_code = excluded.department_code,
  severity = excluded.severity,
  deaths = excluded.deaths,
  affected_count = excluded.affected_count,
  deaths_display = excluded.deaths_display,
  affected_display = excluded.affected_display,
  updated_at = now();

insert into public.organizations (
  id,
  slug,
  name,
  short_description,
  website_url,
  organization_type,
  accent,
  sort_order,
  active
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    'colombian-red-cross',
    'Colombian Red Cross',
    'Local teams on the ground providing emergency relief.',
    'https://www.cruzrojacolombiana.org/',
    'ngo',
    'severe',
    1,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'unicef',
    'UNICEF',
    'Supporting children and families with essential aid.',
    'https://www.unicef.org/',
    'un',
    'info',
    2,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'wfp',
    'WFP',
    'Delivering food assistance to affected communities.',
    'https://www.wfp.org/',
    'un',
    'info',
    3,
    true
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'direct-relief',
    'Direct Relief',
    'Providing medical supplies and essential medicine.',
    'https://www.directrelief.org/',
    'ngo',
    'high',
    4,
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  website_url = excluded.website_url,
  organization_type = excluded.organization_type,
  accent = excluded.accent,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

delete from public.donation_destinations
where organization_id in (
  '33333333-3333-4333-8333-333333333301',
  '33333333-3333-4333-8333-333333333302',
  '33333333-3333-4333-8333-333333333303',
  '33333333-3333-4333-8333-333333333304'
);

insert into public.donation_destinations (
  organization_id,
  destination_url,
  approved_hostname,
  verification_status,
  verified_at,
  is_enabled
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    'https://www.cruzrojacolombiana.org/',
    'www.cruzrojacolombiana.org',
    'verified',
    now(),
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'https://www.unicef.org/',
    'www.unicef.org',
    'verified',
    now(),
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'https://www.wfp.org/',
    'www.wfp.org',
    'verified',
    now(),
    true
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    'https://www.directrelief.org/',
    'www.directrelief.org',
    'verified',
    now(),
    true
  );

delete from public.updates
where disaster_id = '22222222-2222-4222-8222-222222222201';

insert into public.updates (
  disaster_id,
  source_id,
  external_id,
  title,
  summary,
  accent,
  published_at
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111105',
    'seed-unicef-1',
    'Providing clean water and hygiene kits in Chocó communities',
    null,
    'info',
    now() - interval '15 minutes'
  ),
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111104',
    'seed-wfp-1',
    'Delivered food rations to shelters serving 2,000+ people',
    null,
    'high',
    now() - interval '1 hour'
  ),
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111107',
    'seed-red-cross-1',
    'Rescue and medical response continuing in hardest-hit areas',
    null,
    'severe',
    now() - interval '2 hours'
  );
