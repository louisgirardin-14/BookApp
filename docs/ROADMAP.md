# Shelf — path to a real product

Working TODO list from the "what's actually still missing" review. Nothing
in here has been built yet — this is the plan to react to before we start
implementing. Organized so we can pick an order rather than doing all of it
at once.

## Quick fixes (small, low-risk, can do anytime)

- [ ] **RLS gap on `books` update policy.** The `update own books` policy
      checks `user_id = auth.uid()` on the row being read, but has no
      `with check` clause — so in theory a signed-in user could `UPDATE`
      one of their own books and reassign its `user_id` to someone else's
      account (silently "gifting" or orphaning a row). Fix is a one-line
      migration adding `with check (user_id = auth.uid())`. Not exploitable
      today because nothing in the UI does this, but it's a real gap.
- [ ] Backfill/clean up the 5 legacy `user_id = null` books (Task #25,
      still pending — 3 are duplicates of re-added copies, 2 aren't).

## 1. CI/CD & environments

Right now: one Supabase project, one Vercel project, both serving
production. Local `next build` is the only check before every push, and
migrations get applied by hand (though they *are* tracked as files in
`supabase/migrations/`, which is good — that part isn't ad hoc).

- [ ] **GitHub Actions workflow**: on every push/PR, run `next build`,
      `next lint`, and `tsc --noEmit`. Cheap, catches the exact class of
      break we've hit before, blocks a bad deploy before it ships.
- [ ] **Staging Supabase project**: a second (also free-tier) Supabase
      project for testing schema migrations before they touch real data.
      Vercel already gives free preview deployments per branch/PR — wire
      those previews to point at the staging Supabase project via a
      preview-only env var override, so a PR can be clicked through before
      merging to `main`.
- [ ] Migration discipline: keep writing `supabase/migrations/*.sql` files
      (already doing this) and apply them the same way to staging first,
      then production — instead of running ad hoc SQL directly against
      prod, which is what we've done so far out of convenience.
- [ ] Actually merge `claude/book-tracking-app-mvp-bway9u` into `main` at
      some point — right now `main` is empty, which is confusing and means
      GitHub's default branch view shows nothing.

## 2. Security hardening

Current state is better than "friends and family MVP" usually is — RLS is
on and scoped per-account, the service-role key never reaches the client,
owner-only actions are checked server-side (not just hidden in the UI),
and secrets aren't committed. But "extreme" is a specific ask, so here's
the gap list against that bar:

- [ ] Fix the RLS update-policy gap above.
- [ ] Add security headers (CSP, `X-Content-Type-Options`,
      `Referrer-Policy`, `Permissions-Policy`) via `next.config.js` —
      currently none are set beyond Vercel's defaults (HTTPS/HSTS).
- [ ] Rate-limit auth endpoints. Supabase Auth has some built-in abuse
      protection, but nothing app-level stops repeated login/password
      attempts. Worth adding if this ever opens beyond a friend group.
- [ ] Dependency scanning: enable Dependabot (free, GitHub-native) for
      `npm` security advisories.
- [ ] Secrets rotation plan: document how to rotate the Supabase
      service-role key and `OWNER_EMAIL`-gated access if either ever leaks.
- [ ] Backups: Supabase free tier has **no point-in-time recovery** — only
      paid plans get automated backups. Right now, if the database gets
      corrupted or wrongly wiped, there is no restore point. Worth either
      a scheduled manual `pg_dump` export (cheap, scriptable) or moving to
      Supabase Pro ($25/mo) once real user data exists.
- [ ] "What if someone steals the website" — for a Next.js/Vercel/Supabase
      stack, the realistic threats aren't "someone clones your HTML" (they
      can already view-source anything), they're: (a) RLS misconfig
      exposing other users' data — audited above; (b) leaked service-role
      key — currently server-only, good; (c) session/cookie theft via XSS
      — React escapes output by default and nothing uses
      `dangerouslySetInnerHTML`, so this is currently clean; (d) someone
      standing up a *copy* of the app — no code-level defense stops that
      (it's open-source-shaped by nature of being a web app), the only
      real protection is the trademark/brand and the fact your data lives
      in your Supabase project, not theirs.

## 3. Sign-up & onboarding

Current: invite-only, owner manually creates/resets a password via the
Admin API, no email ever sent. Deliberately chosen after magic-link email
kept failing. This is fine at "a few friends" scale and should probably
**stay** the model until there's a real reason to open signup.

If/when self-serve signup is wanted, the realistic open-source-friendly
options (roughly in order of effort):

1. **Supabase Auth + a real transactional email provider** (e.g. Resend —
   generous free tier, trivial Supabase integration) using **OTP codes**
   (6-digit code, not a magic link). This avoids the exact failure mode we
   hit before (magic links break on redirect-URL config and
   session-from-hash-fragment edge cases); a typed code sidesteps both.
2. **Auth.js / NextAuth** — fully open-source, self-hosted, more control,
   but you own more of the plumbing (session storage, email templates)
   yourself; Supabase-as-database-only becomes an option here too.
3. **Clerk / Auth0** — turnkey, well-built signup UX out of the box, but
   it's a third platform to depend on (and pay for past free tier) on top
   of Supabase + Vercel.

Recommendation: stick with invite-only for now; if we open it up, go with
option 1 — smallest change, reuses everything already built.

## 4. Admin side

Today "admin" = the one `OWNER_EMAIL` account, with an owner-only section
inside `/settings` (invite, remove accounts). That's proportionate for one
admin. A fully separate admin site/subdomain would mean running and
securing a second app for no real gain at this scale — not recommended
yet. Worth adding instead:

- [ ] An audit trail (who invited/removed whom, when) — currently these
      actions aren't logged anywhere.
- [ ] Basic usage visibility (storage used, book count, active accounts)
      surfaced in `/settings` for the owner, so growth is visible before
      it becomes a Supabase free-tier problem.

Revisit "separate admin site" if there's ever more than one admin role.

## 5. The "app" side (mobile)

Three real paths, increasing in cost:

1. **PWA** (add a `manifest.json` + icons + basic offline shell). Makes
   the existing site installable to a home screen on iOS/Android, looks
   and feels like an app, zero new backend. Cheapest, and directly
   answers "we want an app too" without a rebuild.
2. **Capacitor** wraps the existing Next.js site in a native shell to
   publish to the App Store/Play Store as a "real" listed app, reusing
   ~100% of current code.
3. **React Native / Expo** native rewrite of the UI, sharing the Supabase
   backend. Biggest lift, but the most native feel (camera/crop flows in
   particular would feel better than in a mobile browser).

Recommendation: PWA first (cheap, immediate), Capacitor if an app-store
listing matters later, native rewrite only if this becomes a real product
with budget for it.

## 6. Monetization

- Given the content (book covers, reading data) and audience, **affiliate
  links** (Amazon Associates, or Bookshop.org which supports indie
  bookstores) fit naturally — e.g. a "buy this book" link on each book's
  detail page — and need no ad-network approval or minimum traffic.
- **Display ads** (Google AdSense) are the other classic option, but
  AdSense approval typically wants real traffic/content volume first, and
  banner ads would clash with the "poetic/bookstagram" aesthetic already
  chosen for this app.
- Either path (ads or affiliate tracking) means real cookie-consent /
  privacy-policy obligations under GDPR since this app has EU users —
  ties into the compliance section below.

Recommendation: affiliate links as the first, low-friction step; hold off
on display ads until there's meaningful traffic.

## 7. Data retention & compliance

- [ ] Privacy policy + terms page (needed before any monetization).
- [ ] Written retention policy: how long deleted-account data/images are
      kept before permanent purge (today: `deleteAccount`/
      `removeUserAccount` purge immediately — good, just needs to be
      *documented* so it can be stated to users).
- [ ] Cookie/consent banner once ads or analytics are added (not needed
      today — the locale cookie is functional/necessary and doesn't
      require consent under GDPR).

---

## Suggested order

1. Quick fixes (RLS gap, backfill) — cheap, no new surface area.
2. CI/CD basics (GitHub Actions build/lint gate) — protects everything
   built after this point.
3. PWA — visible progress toward "we have an app," low cost.
4. Security hardening pass (headers, backups plan).
5. Revisit sign-up only when ready to grow past friends.
6. Monetization + compliance once there's real usage to justify it.
