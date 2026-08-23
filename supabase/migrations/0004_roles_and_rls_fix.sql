-- 1. Close an RLS gap: the update policy on books checked which row you
--    could target, but never checked what you were allowed to change it
--    to -- so a signed-in user could in theory UPDATE one of their own
--    books and reassign its user_id to someone else's account. Add a
--    matching `with check` so an update must still leave the row owned
--    by the same account that owns it.
drop policy if exists "update own books" on public.books;
create policy "update own books" on public.books
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2. Replace the single hardcoded OWNER_EMAIL check with a real role
-- column, so admin rights live in the database (grantable to more than
-- one person later) instead of a single env var comparison scattered
-- across the codebase.
alter table public.profiles
  add column if not exists role text not null default 'member'
  check (role in ('owner', 'admin', 'member'));
