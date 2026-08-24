-- Milestone 8: funding flows (OCHA FTS)
-- Append/upsert by external id; public read for published disasters only.

create type public.funding_status as enum ('pledged', 'committed', 'received', 'unknown');

create table public.funding_flows (
  id uuid primary key default gen_random_uuid(),
  disaster_id uuid not null references public.disaster_events (id) on delete cascade,
  external_id text not null,
  donor text,
  recipient text,
  amount_usd numeric not null check (amount_usd >= 0),
  status public.funding_status not null default 'unknown',
  upstream_status text,
  sector text,
  source_url text,
  reported_at timestamptz,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (disaster_id, external_id)
);

create index funding_flows_disaster_status_idx
  on public.funding_flows (disaster_id, status);

create index funding_flows_disaster_sector_idx
  on public.funding_flows (disaster_id, sector);

alter table public.funding_flows enable row level security;

create policy "Public read funding for published disasters"
  on public.funding_flows
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.disaster_events d
      where d.id = funding_flows.disaster_id
        and d.status = 'published'
    )
  );
