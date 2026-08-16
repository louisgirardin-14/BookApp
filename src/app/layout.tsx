import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Shelf',
  description: 'A personal book-tracking app',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink antialiased">
        <header className="border-b border-ink/10 bg-cream/80 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Shelf
            </Link>
            {user && (
              <div className="flex gap-5 text-sm font-medium">
                <Link href="/" className="hover:opacity-70">
                  Shelf
                </Link>
                <Link href="/add" className="hover:opacity-70">
                  Add Book
                </Link>
                <Link href="/export" className="hover:opacity-70">
                  Export
                </Link>
                <Link href="/explore" className="hover:opacity-70">
                  Explore
                </Link>
                <Link href="/settings" className="hover:opacity-70">
                  Settings
                </Link>
              </div>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
