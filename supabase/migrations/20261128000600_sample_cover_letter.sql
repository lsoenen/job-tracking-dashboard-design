-- A sample cover letter (Word) on the profile, used as the voice and design for generated letters.
alter table public.profiles
  add column if not exists cover_letter_path text,
  add column if not exists cover_letter_name text,
  add column if not exists cover_letter_size_bytes integer,
  add column if not exists cover_letter_updated_at timestamptz;
