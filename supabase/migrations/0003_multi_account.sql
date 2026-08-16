-- Multi-account support: each book belongs to an account, and an
-- account can make its shelf publicly readable (Instagram-style).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles readable by authenticated users" on public.profiles;
create policy "profiles readable by authenticated users" on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update
  to authenticated
  using (id = auth.uid());

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- Auto-create a profile row whenever a new auth user is created (invite
-- or self-serve signup both fire this).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Books now belong to a specific account.
alter table public.books add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Replace the old "public read, service_role-only write" model with
-- per-account RLS: read your own books, or another account's books if
-- they've made their shelf public; write only ever your own.
drop policy if exists "public read" on public.books;

drop policy if exists "read own or public books" on public.books;
create policy "read own or public books" on public.books
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = books.user_id and p.is_public = true
    )
  );

drop policy if exists "insert own books" on public.books;
create policy "insert own books" on public.books
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "update own books" on public.books;
create policy "update own books" on public.books
  for update
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "delete own books" on public.books;
create policy "delete own books" on public.books
  for delete
  to authenticated
  using (user_id = auth.uid());
