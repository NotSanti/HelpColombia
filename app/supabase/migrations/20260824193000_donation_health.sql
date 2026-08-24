-- Milestone 10: donation destination health monitoring audit fields

create type public.donation_health_status as enum (
  'unknown',
  'healthy',
  'unhealthy'
);

alter table public.donation_destinations
  add column health_status public.donation_health_status not null default 'unknown',
  add column health_detail text,
  add column needs_review boolean not null default false,
  add column last_health_error_at timestamptz;

create index donation_destinations_health_review_idx
  on public.donation_destinations (needs_review, health_status)
  where verification_status = 'verified';

comment on column public.donation_destinations.health_status is
  'Result of the latest automated health check.';
comment on column public.donation_destinations.health_detail is
  'Human-readable audit detail from the latest health check.';
comment on column public.donation_destinations.needs_review is
  'Set when an automated check detects an unexpected redirect/host change.';
comment on column public.donation_destinations.last_health_error_at is
  'Timestamp of the most recent failed/unhealthy automated check.';
