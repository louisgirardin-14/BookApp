'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { deleteAccount } from './actions';

export default function DeleteAccountButton() {
  const { dict } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm(dict.settings.deleteAccountConfirm)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAccount();
        router.push('/login');
      } catch (err) {
        setError(err instanceof Error ? err.message : dict.settings.failedToDeleteAccount);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isPending ? dict.settings.deleting : dict.settings.deleteMyAccount}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
