-- Help Colombia Milestone 3 foundation schema
-- Public read-only access for published data; no public writes.

create extension if not exists "pgcrypto";

create type public.disaster_status as enum ('draft', 'published', 'archived');
create type public.trust_tier as enum ('official', 'humanitarian', 'verified_media', 'other');
create type public.severity_level as enum ('severe', 'high', 'moderate', 'low');
create type public.verification_status as enum ('pending', 'verified', 'disabled', 'rejected');
create type public.metric_type as enum (
  'deaths',
  'injured',
  'affected',
  'displaced',
  'aftershocks'
);

create table public.disaster_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  event_type text not null default 'earthquake',
  status public.disaster_status not null default 'draft',
  occurred_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  magnitude numeric(4, 1),
  depth_km numeric(8, 2),
  epicenter_label text,
  aftershocks_label text,
  headline text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  source_type text not null default 'agency',
  base_url text,
  trust_tier public.trust_tier not null default 'other',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.impact_metrics (
  id uuid primary key default gen_random_uuid(),
  disaster_id uuid not null references public.disaster_events (id) on delete cascade,
  metric_type public.metric_type not null,
  value numeric not null,
  unit text not null default 'count',
  display_value text,
  detail text,
  department text,
  municipality text,
  source_id uuid references public.sources (id) on delete set null,
  source_url text,
  reported_at timestamptz,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index impact_metrics_disaster_metric_idx
  on public.impact_metrics (disaster_id, metric_type, retrieved_at desc);

create table public.regions (
  id text primary key,
  disaster_id uuid not null references public.disaster_events (id) on delete cascade,
  name text not null,
  department_code text,
  severity public.severity_level not null default 'moderate',
  geometry jsonb,
  affected_count integer,
  deaths integer,
  injured integer,
  displaced integer,
  deaths_display text,
  affected_display text,
  updated_at timestamptz not null default now()
);

create index regions_disaster_id_idx on public.regions (disaster_id);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  website_url text,
  logo_url text,
  organization_type text,
  accent text not null default 'info',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donation_destinations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  destination_url text not null,
  approved_hostname text not null,
  verification_status public.verification_status not null default 'pending',
  verified_at timestamptz,
  last_checked_at timestamptz,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donation_destinations_https_check
    check (destination_url ~* '^https://'),
  constraint donation_destinations_hostname_check
    check (length(approved_hostname) > 0)
);

create index donation_destinations_org_idx
  on public.donation_destinations (organization_id);

create table public.updates (
  id uuid primary key default gen_random_uuid(),
  disaster_id uuid not null references public.disaster_events (id) on delete cascade,
  source_id uuid references public.sources (id) on delete set null,
  external_id text,
  title text not null,
  summary text,
  source_url text,
  accent text not null default 'info',
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create index updates_disaster_published_idx
  on public.updates (disaster_id, published_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger disaster_events_set_updated_at
  before update on public.disaster_events
  for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger donation_destinations_set_updated_at
  before update on public.donation_destinations
  for each row execute function public.set_updated_at();

-- RLS ------------------------------------------------------------------

alter table public.disaster_events enable row level security;
alter table public.sources enable row level security;
alter table public.impact_metrics enable row level security;
alter table public.regions enable row level security;
alter table public.organizations enable row level security;
alter table public.donation_destinations enable row level security;
alter table public.updates enable row level security;

-- Public SELECT only for published / active content.
create policy "Public read published disasters"
  on public.disaster_events
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Public read active sources"
  on public.sources
  for select
  to anon, authenticated
  using (active = true);

create policy "Public read metrics for published disasters"
  on public.impact_metrics
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.disaster_events d
      where d.id = impact_metrics.disaster_id
        and d.status = 'published'
    )
  );

create policy "Public read regions for published disasters"
  on public.regions
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.disaster_events d
      where d.id = regions.disaster_id
        and d.status = 'published'
    )
  );

create policy "Public read active organizations"
  on public.organizations
  for select
  to anon, authenticated
  using (active = true);

create policy "Public read verified enabled destinations"
  on public.donation_destinations
  for select
  to anon, authenticated
  using (
    verification_status = 'verified'
    and is_enabled = true
    and exists (
      select 1
      from public.organizations o
      where o.id = donation_destinations.organization_id
        and o.active = true
    )
  );

create policy "Public read updates for published disasters"
  on public.updates
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.disaster_events d
      where d.id = updates.disaster_id
        and d.status = 'published'
    )
  );

-- No INSERT/UPDATE/DELETE policies for anon/authenticated.
-- Service role bypasses RLS for seeding and future admin/ingestion.
