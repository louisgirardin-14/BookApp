# Setup

## Already done for you

- **Supabase project** `bookapp` created (project ref `vrqhvdftqcisqxdccteb`, region `us-east-1`).
- **Schema migrations** applied: `books` table, `profiles` table, RLS policies for
  per-account access, a `covers` storage bucket. See `supabase/migrations/`.
- **GitHub repo** pushed to `louisgirardin-14/BookApp` on branch `claude/book-tracking-app-mvp-bway9u`.
- **Vercel project** `bookapp` created and linked to the repo (auto-deploys on push).

## How accounts work

Signup is invite-only:

- The account whose email matches `OWNER_EMAIL` can invite other people from
  **Settings → Invite a friend**. Nobody else can create an account.
- Each account's books are private by default. Flipping **Settings → Shelf
  visibility** to public lets other signed-in accounts view that shelf
  read-only (like a public Instagram profile) — they still can't edit or
  delete anything that isn't theirs.
- Deleting your account (Settings → Danger zone) removes your books, cover
  photos, and profile permanently.

## Manual steps required

### 1. Service role key

Already required before this change — see Vercel env vars below if not yet set.

### 2. `OWNER_EMAIL` environment variable

Add an environment variable in Vercel:

| Variable | Value |
|---|---|
| `OWNER_EMAIL` | `Louis.girardin@icloud.com` |

### 3. Configure Supabase Auth redirect URLs

Invite emails link back to `/auth/set-password` on your live domain. Supabase
rejects redirects to URLs it doesn't recognize, so:

1. Go to https://supabase.com/dashboard/project/vrqhvdftqcisqxdccteb/auth/url-configuration
2. Set **Site URL** to your production URL, e.g. `https://bookapp-tau-rose.vercel.app`
3. Under **Redirect URLs**, add `https://bookapp-tau-rose.vercel.app/**`
4. Save.

### 4. Bootstrap your own account

1. Visit the live site — you'll land on `/login`.
2. Since no accounts exist yet, you'll see **"Send me an invite"**. Click it.
3. Check `OWNER_EMAIL`'s inbox for the Supabase invite email, click the link.
4. You'll land on **Set your password** — choose one and continue. You're in.

### 5. (One-time) reassign your existing books

You had 5 books saved before accounts existed. Once you've completed step 4,
tell me and I'll assign those existing rows to your new account (a quick SQL
update) so they show up on your Shelf.

## Environment variables

| Variable | Where it's used | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | `https://vrqhvdftqcisqxdccteb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | see Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (storage uploads, invites) | Supabase dashboard → Settings → API Keys → service_role |
| `OWNER_EMAIL` | server only (who can invite people) | your email |

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in the values above
npm run dev
```

## Deploying changes

The app is deployed on Vercel, connected to the GitHub repo. Pushing to the
production branch triggers a new deployment automatically.
