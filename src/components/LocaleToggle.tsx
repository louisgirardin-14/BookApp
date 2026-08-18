'use client';

import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
      className="rounded-lg border border-ink/15 px-2 py-1 text-lg leading-none hover:bg-ink/5"
      aria-label={locale === 'en' ? 'Switch to French' : 'Passer en anglais'}
      title={locale === 'en' ? 'Switch to French' : 'Passer en anglais'}
    >
      {locale === 'en' ? '🇬🇧' : '🇫🇷'}
    </button>
  );
}
