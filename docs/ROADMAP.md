# Shelf — path to a real product

Working TODO list from the "what's actually still missing" review, updated
as items ship. Organized so we can pick an order rather than doing all of
it at once.

## Status as of the native-app session

**Shipped:**
- RLS gap on `books` update policy — fixed (migration `0004`).
- Admin is role-based (`profiles.role`: owner/admin/member) instead of a
  hardcoded `OWNER_EMAIL` string check — owner can promote/revoke admin
  from Settings.
- Google sign-in is live, invite-gated via a new `invited_emails`
  allowlist table (migration `0005`), flippable to open registration via
  a single `OPEN_SIGNUP` env var. Apple sign-in intentionally skipped
  (Apple Developer Program costs $99/yr; Google is free).
- CI: GitHub Actions runs lint + typecheck + build on every push
  (`.github/workflows/ci.yml`), plus the ESLint config the project always
  expected but never had.
- Duplicate-book soft warning on Add Book (same title+author already on
  the shelf — confirm-to-add-anyway, not a hard block).
- Search no longer silently drops real matches that lack a cover image
  (foreign/small-press editions) — shows a placeholder tile instead.
- Basic security response headers (X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy).
- **The app is now a real native iOS app** (not just PWA) via Capacitor,
  running on-device via Xcode (not yet App Store/TestFlight):
  - `ios/` native project is committed to the repo (was local-only).
  - Custom app icon + branded splash screen (replacing Capacitor's
    default blue-swirl placeholder on both).
  - Fixed the web app rendering under the iOS status bar/notch
    (`viewport-fit=cover` + safe-area padding) — was unusable, nav links
    were literally behind the status bar.
  - Fixed rubber-band/bounce drag feel, added real tap-press feedback,
    locked pinch-zoom — reads as a native app, not a website in a webview.
  - Added `NSCameraUsageDescription` — camera capture (cover/spine
    photos) needs this to work at all inside the WKWebView; likely was
    silently broken before this.
  - Status bar set to dark content (was invisible against the cream bg).

**Still open:**
- [ ] Backfill/clean up the 5 legacy `user_id = null` books (3 are
      duplicates of re-added copies, 2 aren't) — blocked on Supabase MCP
      reconnecting, or run manually via the SQL given earlier in-session.
- [ ] Merge to `main` (still empty/unused — see CI/CD section).
- [ ] Bottom-tab-bar navigation — proposed, not yet decided/built. Current
      nav is a website-style top row of text links; a native app would
      more typically use a bottom tab bar (icons + labels, thumb
      reachable). Worth revisiting now the app is otherwise native-feeling.
- [ ] Offline state handling — since the native shell loads the site
      live over the network (no bundled assets), no connection currently
      means a blank/broken WebView rather than a friendly message. Native
      Capacitor/WKWebView-side fix, not yet built.
- [ ] Keyboard-covers-input check — not yet verified on-device whether
      the keyboard properly avoids covering form fields (title/author/
      notes) when typing.
- [ ] App Store / TestFlight distribution — currently only installable
      via Xcode + a trusted developer certificate (free, but expires
      after ~7 days without the paid $99/yr Apple Developer Program).

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

## 3. Sign-up & onboarding — Google OAuth done, still invite-gated

Email/password invite-only still works (owner sets a password via Admin
API), and Google sign-in now also works, gated by the same invite
allowlist. Apple was intentionally skipped (costs $99/yr; revisit if
Apple sign-in specifically becomes worth it).

Flipping to fully open public sign-up later is a single env var
(`OPEN_SIGNUP=true`), not an architecture change — recommendation is still
to leave it off until there's a real reason to grow past friends, since
open sign-up brings real moderation/storage/compliance obligations with
it (see Data retention section).

## 4. Admin side — role column done

`profiles.role` (owner/admin/member) replaced the single `OWNER_EMAIL`
check; the owner can promote/revoke admin rights on other accounts from
`/settings` without touching env vars or redeploying. Still open:

- [ ] An audit trail (who invited/removed whom, when) — currently these
      actions aren't logged anywhere.
- [ ] Basic usage visibility (storage used, book count, active accounts)
      surfaced in `/settings` for the owner, so growth is visible before
      it becomes a Supabase free-tier problem.

## 5. The "app" side (mobile) — native app running, not published yet

Went with **Capacitor** (option 2 below) over PWA, since the goal was a
real installable app, not just a home-screen icon — see "Status" above
for what's shipped. Options for reference:

1. **PWA** (manifest + icons + offline shell) — not pursued; would have
   been cheaper but doesn't produce an actual App Store-installable app.
2. **Capacitor** (chosen) — wraps the existing Next.js site in a native
   shell, reusing ~100% of the web code; the native shell just loads the
   live Vercel deployment (`server.url` mode) rather than bundling static
   assets, since this app is fully server-rendered.
3. **React Native / Expo** native rewrite — not pursued; much bigger
   lift, only worth it if this becomes a funded, long-term product.

Next milestone for this track: App Store/TestFlight distribution (needs
the $99/yr Apple Developer Program, which local Xcode testing doesn't).

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

## Suggested next steps (updated)

1. Backfill the 5 legacy books — last easy cleanup item outstanding.
2. Decide on bottom-tab-bar navigation now the app is otherwise
   native-feeling (currently a website-style top nav).
3. Offline-state handling + on-device keyboard check — round out the
   native app before considering App Store/TestFlight.
4. Merge to `main` at some point (still empty).
5. Revisit sign-up (open registration) / monetization / compliance only
   once there's real usage beyond friends to justify it.
