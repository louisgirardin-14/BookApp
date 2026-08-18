'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { removeUserAccount } from './actions';

export default function ManageAccountsSection({
  accounts,
}: {
  accounts: { id: string; email: string | null }[];
}) {
  const { dict } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function remove(id: string, email: string | null) {
    if (!confirm(dict.settings.removeConfirm(email ?? ''))) return;
    setError(null);
    setRemovingId(id);
    startTransition(async () => {
      try {
        await removeUserAccount(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : dict.settings.failedToRemoveAccount);
      } finally {
        setRemovingId(null);
      }
    });
  }

  if (accounts.length === 0) {
    return <p className="text-sm text-ink/60">{dict.settings.noOtherAccounts}</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 bg-white">
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center justify-between px-3 py-2">
            <span className="text-sm">{a.email}</span>
            <button
              type="button"
              onClick={() => remove(a.id, a.email)}
              disabled={isPending && removingId === a.id}
              className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isPending && removingId === a.id ? dict.settings.removing : dict.settings.remove}
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
