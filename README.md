# Shelf

A personal book-tracking app: log books as you finish them, and export an
aesthetic image of your covers + stats to share (Instagram Story, etc.).
Multi-account, invite-only.

Live at: https://bookapp-tau-rose.vercel.app

## What's built

### Accounts
- Real per-account login (Supabase Auth, email + password). No self-serve
  signup — only the owner account (`OWNER_EMAIL`) can create new accounts,
  from **Settings → Invite a friend**. That creates the account with a
  temporary password shown to the owner to relay directly (text, WhatsApp,
  etc.) — there's no email/magic-link dependency anywhere in the app, by
  design (Supabase's shared email sending proved unreliable in practice).
- Each account's books are private by default. **Settings → Shelf
  visibility** lets an account go public — other signed-in accounts can then
  view (read-only) that shelf from **Explore**, but never edit or delete
  anything that isn't theirs.
- **Settings → Change password** lets anyone set their own password after
  logging in with a temporary one.
- **Settings → Manage accounts** (owner-only) lists every other account and
  can permanently remove one (books, photos, login, all of it).
- **Settings → Delete my account** is self-serve account deletion (GDPR
  right-to-erasure): removes your storage photos, then your login, which
  cascades to your profile and every book you own.

### Shelf (home page)
Grid of your books, sorted by date read, descending. Tap a book to view/edit
it, or to view someone else's public book (read-only).

### Add Book
- Search by title/author/ISBN — queries Open Library and Google Books in
  parallel and merges results, so one provider having a bad cover link
  doesn't blank the results.
- ISBN-shaped queries use each provider's exact-match lookup instead of a
  fuzzy text search, which matters for regional/small-press editions.
- No cover found (or want your own)? Take a photo: OpenCV.js (client-side,
  WASM) auto-detects the book's edges and straightens it, with a manual
  crop override (react-easy-crop) including rotation for a crooked or
  sideways shot.
- Whichever cover you pick — search result or your own photo — gets
  downloaded and re-saved into our own Supabase Storage bucket the moment
  you save the book, so your data doesn't depend on Open Library/Google's
  CDNs staying up.
- From a book's detail page you can also change its cover later, or add a
  photo of the book's spine specifically (thin aspect ratio), which the
  Export "spines" layout will use in place of a squished front cover.

### Export
- Pick a date range (this month / last month / custom), a layout (grid of
  covers, or an edge-to-edge "spine wall"), and a theme (Cream / Dark /
  Kraft Paper).
- The spines layout draws a real timeline: a connecting line under the row
  with tick marks and month/year labels at each point the reading crosses
  into a new period.
- Renders to a 1080×1350 canvas and saves via the native share sheet
  (`navigator.share` with a file) — the reliable way to get an image into
  Photos on iOS/Android, and it also offers Instagram directly as a share
  target. Falls back to a classic download link where Web Share isn't
  available.

## Tech stack
Next.js (App Router) + Supabase (Postgres, Auth, Storage), deployed on
Vercel. See [SETUP.md](./SETUP.md) for environment variables and one-time
Supabase Auth configuration.

## Known gaps / next steps

- **Backfill**: 5 books added before multi-account existed still need their
  `user_id` set to the owner's account (one-time SQL update).
- **Export aesthetic direction**: explored a "bookstagram/Pinterest mood
  board" look (handwritten title font, poetic caption, tilted polaroid-style
  photos, a soft rose theme) as an opt-in set of toggles, then reverted it
  to reconsider the direction before committing further. Ideas on the table
  for a next pass: a ribbon/bookmark accent, moon-or-star-shaped rating
  icons, subtle paper grain texture, and a torn/deckled photo edge instead
  of the current clean or polaroid-white border.
- **Cover edge detection**: OpenCV.js auto-crop is a best-effort contour
  detector — it can miss on low-contrast backgrounds and falls back to
  manual crop when it does. Logging each manual correction (auto-detected
  quad vs. the user's final crop) was discussed as a free way to build a
  training set if a proper ML model is ever worth building, but isn't
  implemented yet.
- **Multi-language**: considered, decided against for now (English only).
- **Instagram Story auto-publish**: true one-tap auto-publish via
  Instagram's API needs a Business/Creator account and Meta App Review, so
  it isn't implemented; the share-sheet flow above already gets a user to
  Instagram in one tap, just not fully automated.
