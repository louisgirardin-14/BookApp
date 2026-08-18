import 'server-only';
import { cookies } from 'next/headers';
import { dictionaries, type Locale } from './dictionary';
import { LOCALE_COOKIE } from './constants';

export function getLocale(): Locale {
  const raw = cookies().get(LOCALE_COOKIE)?.value;
  return raw === 'fr' ? 'fr' : 'en';
}

export function getDictionary() {
  return dictionaries[getLocale()];
}
