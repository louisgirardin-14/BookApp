'use client';

import { createContext, useCallback, useContext, useState } from 'react';
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
