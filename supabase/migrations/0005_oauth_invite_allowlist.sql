-- Google/Apple sign-in creates the auth.users row automatically on first
-- login (unlike the existing password-invite flow, which pre-creates the
-- user via the Admin API). To keep sign-up invite-only, we need an
-- allowlist that exists independently of whether an auth user has ever
-- been created -- checked in the OAuth callback before a session is kept.
create table if not exists public.invited_emails (
  email text primary key,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.invited_emails enable row level security;
-- No policies: only the server-only supabaseAdmin client (service role)
-- reads/writes this table. Regular users have no reason to see who's
-- been invited.

-- Backfill: everyone who already has a profile today was already invited
-- (by definition -- either they're the owner or someone the owner
-- created an account for), so seed the allowlist from existing profiles
-- to avoid locking out anyone already using the app.
insert into public.invited_emails (email)
select email from public.profiles where email is not null
on conflict (email) do nothing;
