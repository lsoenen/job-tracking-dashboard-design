-- Real job postings for Canvas, pulled daily from public company job boards
-- (Greenhouse, Lever, Ashby) by /api/cron/sync-jobs.

create table public.jobs (
  id text primary key,                       -- "<source>:<board>:<posting id>"
  source text not null check (source in ('greenhouse', 'lever', 'ashby')),
  board text not null,                       -- the company's board slug at that source
  company text not null,
  company_domain text,
  title text not null,
  role_family text not null,                 -- e.g. 'product-design'
  department text,
  location text,
  is_remote boolean not null default false,
  url text not null,
  summary text not null default '',
  description text not null default '',
  keywords text[] not null default '{}',
  min_years integer not null default 0,
  posted_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_active boolean not null default true
);

create index jobs_active_posted_idx on public.jobs (role_family, posted_at desc) where is_active;
create index jobs_board_idx on public.jobs (source, board) where is_active;

alter table public.jobs enable row level security;

-- Any signed-in user can read open postings. Only the server (secret key) writes.
create policy "Signed-in users read active jobs" on public.jobs
  for select to authenticated using (is_active);

grant select on public.jobs to authenticated;
revoke all on public.jobs from anon;
