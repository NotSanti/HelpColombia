-- Milestone 12: admin audit trail (service-role writes only; no public policies)

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create index admin_audit_log_entity_idx
  on public.admin_audit_log (entity_type, entity_id);

alter table public.admin_audit_log enable row level security;

comment on table public.admin_audit_log is
  'Append-only admin action log; accessed via service role only.';
