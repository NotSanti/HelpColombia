-- Milestone 9: IFRC GO operational response (appeals, reach, activities, sitreps)
-- Raw IFRC rows stay here; public HelpCard summaries are derived at read time.

create table public.ifrc_operations (
  id uuid primary key default gen_random_uuid(),
  disaster_id uuid not null references public.disaster_events (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  external_event_id text not null,
  external_appeal_id text,
  appeal_code text,
  appeal_name text,
  appeal_status text,
  event_name text,
  target_population integer check (target_population is null or target_population >= 0),
  people_reached integer check (people_reached is null or people_reached >= 0),
  amount_requested numeric check (amount_requested is null or amount_requested >= 0),
  amount_funded numeric check (amount_funded is null or amount_funded >= 0),
  currency_code text,
  activities text[] not null default '{}',
  activity_summary text,
  source_url text not null,
  reported_at timestamptz,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (disaster_id, external_event_id)
);

create index ifrc_operations_disaster_idx
  on public.ifrc_operations (disaster_id);

create index ifrc_operations_org_idx
  on public.ifrc_operations (organization_id);

create table public.ifrc_ops_updates (
  id uuid primary key default gen_random_uuid(),
  disaster_id uuid not null references public.disaster_events (id) on delete cascade,
  operation_id uuid references public.ifrc_operations (id) on delete cascade,
  external_id text not null,
  title text not null,
  document_url text,
  published_at timestamptz,
  retrieved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (disaster_id, external_id)
);

create index ifrc_ops_updates_disaster_published_idx
  on public.ifrc_ops_updates (disaster_id, published_at desc);

alter table public.ifrc_operations enable row level security;
alter table public.ifrc_ops_updates enable row level security;

create policy "Public read IFRC operations for published disasters"
  on public.ifrc_operations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.disaster_events d
      where d.id = ifrc_operations.disaster_id
        and d.status = 'published'
    )
  );

create policy "Public read IFRC ops updates for published disasters"
  on public.ifrc_ops_updates
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.disaster_events d
      where d.id = ifrc_ops_updates.disaster_id
        and d.status = 'published'
    )
  );
