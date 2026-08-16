-- Optional photo of the book's spine, used by the Export "spines" layout
-- in preference to squishing the front cover when available.
alter table public.books add column if not exists spine_url text;
