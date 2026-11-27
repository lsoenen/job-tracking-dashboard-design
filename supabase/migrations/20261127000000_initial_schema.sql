-- Pursuit: initial schema
-- Run this once in Supabase → SQL Editor (or with `supabase db push`).

-- ---------------------------------------------------------------------------
-- Profiles: one row per signed-up user (created automatically on sign-up)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  headline text not null default '',
  location text not null default '',
  years_experience integer not null default 0 check (years_experience between 0 and 80),
  skills text not null default '',
  background text not null default '',
  weekly_application_goal integer not null default 5 check (weekly_application_goal between 0 and 100),
  resume_path text,
  resume_name text,
  resume_size_bytes integer,
  resume_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (length(trim(company)) > 0),
  role text not null check (length(trim(role)) > 0),
  logo text,
  description text,
  source_url text,
  company_url text,
  canvas_job_id text,
  status text not null default 'Applied' check (
    status in ('Interested', 'Applied', 'Interviewing', 'Take-home', 'Offer', 'Not moving forward')
  ),
  interview_stage text check (
    interview_stage in ('recruiter', 'hiring-manager', 'team-technical-case', 'final-executive')
  ),
  applied_date date,
  next_step text not null default '',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Status history: every status change is logged, so charts can show *when*
-- replies happened, not just the current state.
-- ---------------------------------------------------------------------------
create table public.application_status_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now()
);

create index application_status_events_user_idx on public.application_status_events (user_id, changed_at);

-- ---------------------------------------------------------------------------
-- Interview practice: which prep questions a user has marked as practiced
-- ---------------------------------------------------------------------------
create table public.interview_practice (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  persona_slug text not null,
  question_id text not null,
  practiced_at timestamptz not null default now(),
  primary key (user_id, application_id, persona_slug, question_id)
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- Log status changes (runs with definer rights so users cannot forge history)
create or replace function public.log_application_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_status_events (application_id, user_id, from_status, to_status)
    values (new.id, new.user_id, case when tg_op = 'UPDATE' then old.status end, new.status);
  end if;
  return new;
end;
$$;

create trigger applications_log_status
  after insert or update of status on public.applications
  for each row execute function public.log_application_status();

-- Create an empty profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security: every user can only see and change their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_events enable row level security;
alter table public.interview_practice enable row level security;

create policy "Users read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users read own applications" on public.applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create own applications" on public.applications
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own applications" on public.applications
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own applications" on public.applications
  for delete to authenticated using ((select auth.uid()) = user_id);

-- History is read-only for users; only the trigger writes it
create policy "Users read own status history" on public.application_status_events
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users read own practice" on public.interview_practice
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own practice" on public.interview_practice
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "Users remove own practice" on public.interview_practice
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Resume storage: private bucket, files live under "<user id>/..."
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy "Users read own resumes" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload own resumes" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users update own resumes" on storage.objects
  for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete own resumes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
