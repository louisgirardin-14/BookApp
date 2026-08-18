'use client';

import { useState } from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { resetOwnerPassword } from './actions';

export default function ClaimOwnerForm({
  next,
  initiallyOpen = false,
}: {
  next: string;
  initiallyOpen?: boolean;
}) {
  const { dict } = useLocale();
  const [open, setOpen] = useState(initiallyOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full text-center text-sm text-ink/60 underline hover:text-ink"
      >
        {dict.login.forgotPassword}
      </button>
    );
  }

  return (
    <form action={resetOwnerPassword} className="mt-4 space-y-3 border-t border-ink/10 pt-4">
      <input type="hidden" name="next" value={next} />
      <p className="text-sm text-ink/60">{dict.login.claimDescription}</p>
      <input
        type="password"
        name="password"
        placeholder={dict.login.newPassword}
        required
        className="w-full rounded-lg border border-ink/15 px-3 py-2"
      />
      <input
        type="password"
        name="confirm"
        placeholder={dict.login.confirmPassword}
        required
        className="w-full rounded-lg border border-ink/15 px-3 py-2"
      />
      <button
        type="submit"
        className="w-full rounded-lg border border-ink/15 py-2 text-sm hover:bg-ink/5"
      >
        {dict.login.setPasswordAndSignIn}
      </button>
    </form>
  );
}
