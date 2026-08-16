# Shelf

A personal book-tracking app: log books you've read, and export an aesthetic
image of your covers + stats for sharing.

- **Shelf** — grid of your books, sorted by date read.
- **Add Book** — search Open Library / Google Books for a cover, or take a
  photo and auto-crop it with OpenCV.js (with a manual override).
- **Export** — pick a date range, layout, and theme, and download a
  1080×1350 PNG for Instagram.

Built with Next.js (App Router) + Supabase (Postgres + Storage), deployed on
Vercel. See [SETUP.md](./SETUP.md) for environment setup and the one manual
step required before writes will work.
