'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dictionaries, type Locale } from './dictionary';
import { LOCALE_COOKIE } from './constants';

interface LocaleContextValue {
  locale: Locale;
  dict: (typeof dictionaries)['en'];
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // WebKit only evaluates :active styles on tap if something in the tree
  // listens for touch events -- otherwise taps skip straight to click
  // with no pressed state at all. A no-op listener is enough to turn it on.
  useEffect(() => {
    const noop = () => {};
    document.addEventListener('touchstart', noop, { passive: true });
    return () => document.removeEventListener('touchstart', noop);
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
      setLocaleState(next);
      router.refresh();
    },
    [router]
  );

  return (
    <LocaleContext.Provider value={{ locale, dict: dictionaries[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
