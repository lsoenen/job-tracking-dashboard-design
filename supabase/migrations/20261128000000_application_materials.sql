-- Saved AI drafts per application: one cover letter and one tailored resume each.
create table public.application_materials (
  application_id uuid not null references public.applications (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('cover-letter', 'resume')),
  -- cover letter: { "text": "..." } · resume: { "summary": "...", "skills": "..." }
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (application_id, kind)
);

create index application_materials_user_idx on public.application_materials (user_id);

create trigger application_materials_set_updated_at
  before update on public.application_materials
  for each row execute function public.set_updated_at();

alter table public.application_materials enable row level security;

create policy "Users read own materials" on public.application_materials
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own materials" on public.application_materials
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.applications a where a.id = application_id and a.user_id = (select auth.uid()))
  );
create policy "Users update own materials" on public.application_materials
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own materials" on public.application_materials
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.application_materials to authenticated;
revoke all on public.application_materials from anon;
