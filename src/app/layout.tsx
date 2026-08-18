import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { getLocale, getDictionary } from '@/lib/i18n/getLocale';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import LocaleToggle from '@/components/LocaleToggle';

export const metadata: Metadata = {
  title: 'Shelf',
  description: 'A personal book-tracking app',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = getLocale();
  const dict = getDictionary();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <LocaleProvider initialLocale={locale}>
          <header className="border-b border-ink/10 bg-cream/80 backdrop-blur">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                {dict.login.appName}
              </Link>
              <div className="flex items-center gap-5 text-sm font-medium">
                {user && (
                  <>
                    <Link href="/" className="hover:opacity-70">
                      {dict.nav.shelf}
                    </Link>
                    <Link href="/add" className="hover:opacity-70">
                      {dict.nav.addBook}
                    </Link>
                    <Link href="/export" className="hover:opacity-70">
                      {dict.nav.export}
                    </Link>
                    <Link href="/explore" className="hover:opacity-70">
                      {dict.nav.explore}
                    </Link>
                    <Link href="/settings" className="hover:opacity-70">
                      {dict.nav.settings}
                    </Link>
                  </>
                )}
                <LocaleToggle />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
