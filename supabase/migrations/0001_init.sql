-- Books table + RLS + storage bucket for self-uploaded covers.
-- Run this in the Supabase SQL Editor for your project (or via `supabase db push`).

create extension if not exists pgcrypto;

do $$ begin
  create type cover_source_enum as enum ('api', 'self-uploaded');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn text,
  cover_url text not null,
  cover_source cover_source_enum not null default 'api',
  date_read date not null default current_date,
  rating int check (rating is null or (rating between 1 and 5)),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists books_date_read_idx on public.books (date_read desc);

alter table public.books enable row level security;

-- Reads are public at the RLS layer; the app itself is protected by a
-- shared-password gate in Next.js middleware. All writes (insert/update/
-- delete) go through Next.js server actions using the service_role key,
-- which bypasses RLS entirely -- so no write policies are defined here,
-- meaning the anon key can never write to this table.
drop policy if exists "public read" on public.books;
create policy "public read" on public.books
  for select
  using (true);

-- Storage bucket for self-uploaded / cropped cover photos.
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "covers public read" on storage.objects;
create policy "covers public read" on storage.objects
  for select
  using (bucket_id = 'covers');

-- No insert/update/delete storage policies for anon: uploads happen
-- server-side via the service_role key in a Next.js server action.
