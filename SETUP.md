# Setup

Most of the setup is automated. One manual step remains, for security reasons.

## Already done for you

- **Supabase project** `bookapp` created (project ref `vrqhvdftqcisqxdccteb`, region `us-east-1`).
- **Schema migration** applied: `books` table, RLS enabled with a public-read policy,
  and a `covers` storage bucket with public read. See `supabase/migrations/0001_init.sql`.
- **GitHub repo** pushed to `louisgirardin-14/BookApp` on branch `claude/book-tracking-app-mvp-bway9u`.

## The one manual step: service_role key

Writes (add/edit/delete a book, upload a cover photo) go through Next.js server actions
using Supabase's `service_role` key, which bypasses Row Level Security. This is what
makes "only I can write" work: the public `anon` key (shipped to the browser) can only
read, and the `service_role` key never leaves the server.

Supabase's tooling deliberately does not expose this secret programmatically, so:

1. Go to https://supabase.com/dashboard/project/vrqhvdftqcisqxdccteb/settings/api
2. Copy the **service_role** secret (under "Project API keys").
3. Add it as an environment variable named `SUPABASE_SERVICE_ROLE_KEY` in your Vercel
   project settings (Project → Settings → Environment Variables), and in your local
   `.env.local` if running locally.
4. Redeploy (or trigger a new deployment) so it takes effect.

Until this is set, the Shelf and Export pages will work (read-only), but Add/Edit/Delete
will fail.

## Environment variables

| Variable | Where it's used | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | `https://vrqhvdftqcisqxdccteb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server (reads) | see Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | server only (writes) | **you provide this — see above** |
| `APP_PASSWORD` | server only (login gate) | pick any password |

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in the values above
npm run dev
```

## Deploying changes

The app is deployed on Vercel, connected to the GitHub repo. Pushing to the
production branch triggers a new deployment automatically. To change the app
password later, update `APP_PASSWORD` in Vercel's environment variables and
redeploy.
