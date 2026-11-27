-- Extra details about a job (salary, location, industry, excitement, custom fields…).
-- Stored as one flexible JSON object so new fields don't need a database change.
alter table public.applications
  add column if not exists details jsonb not null default '{}'::jsonb;
