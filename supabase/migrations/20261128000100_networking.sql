-- Networking: people tied to an application, plus saved "who to look for" suggestions.

-- Saved suggestions live alongside the other per-application drafts
alter table public.application_materials drop constraint if exists application_materials_kind_check;
alter table public.application_materials
  add constraint application_materials_kind_check check (kind in ('cover-letter', 'resume', 'networking'));

create table public.application_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id uuid not null references public.applications (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  title text not null default '',
  relationship text not null default 'teammate' check (
    relationship in ('hiring-manager', 'recruiter', 'teammate', 'partner', 'leader', 'referral', 'other')
  ),
  linkedin_url text,
  email text,
  outreach_status text not null default 'not-contacted' check (
    outreach_status in ('not-contacted', 'reached-out', 'replied', 'referred', 'no-response')
  ),
  last_contacted_on date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index application_contacts_application_idx on public.application_contacts (application_id, created_at);

create trigger application_contacts_set_updated_at
  before update on public.application_contacts
  for each row execute function public.set_updated_at();

alter table public.application_contacts enable row level security;

create policy "Users read own contacts" on public.application_contacts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own contacts" on public.application_contacts
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "Users update own contacts" on public.application_contacts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own contacts" on public.application_contacts
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.application_contacts to authenticated;
revoke all on public.application_contacts from anon;
