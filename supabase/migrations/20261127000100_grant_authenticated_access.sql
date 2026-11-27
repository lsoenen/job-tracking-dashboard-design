-- Newer Supabase projects don't expose new tables to the API automatically.
-- Give signed-in users access; row-level security still limits them to their own rows.
-- Signed-out visitors (anon) get no access at all.
grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select on public.application_status_events to authenticated;
grant select, insert, delete on public.interview_practice to authenticated;

revoke all on public.profiles, public.applications, public.application_status_events, public.interview_practice from anon;
