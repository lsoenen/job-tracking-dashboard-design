-- Let the server-side job sync (secret / service_role key) write to the jobs table.
-- Newer Supabase projects don't grant this automatically.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.jobs to service_role;
