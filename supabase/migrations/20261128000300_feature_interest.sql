-- People who want to hear about, or help shape, features that aren't out yet (e.g. Canvas).
-- One row per person per feature; signing up again updates their email and note.
create table public.feature_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  feature text not null check (feature in ('canvas')),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature)
);

create trigger feature_interest_set_updated_at
  before update on public.feature_interest
  for each row execute function public.set_updated_at();

alter table public.feature_interest enable row level security;

-- Users only see and change their own sign-up. You read the full list in the Supabase dashboard.
create policy "Users read own interest" on public.feature_interest
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own interest" on public.feature_interest
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own interest" on public.feature_interest
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant select, insert, update on public.feature_interest to authenticated;
revoke all on public.feature_interest from anon;
