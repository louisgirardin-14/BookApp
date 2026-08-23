'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { removeUserAccount, setAccountRole } from './actions';

export default function ManageAccountsSection({
  accounts,
  canManageRoles,
}: {
  accounts: { id: string; email: string | null; role: string }[];
  canManageRoles: boolean;
}) {
  const { dict } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function remove(id: string, email: string | null) {
    if (!confirm(dict.settings.removeConfirm(email ?? ''))) return;
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      try {
        await removeUserAccount(id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : dict.settings.failedToRemoveAccount);
      } finally {
        setBusyId(null);
      }
    });
  }

  function toggleAdmin(id: string, currentRole: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      try {
        await setAccountRole(id, currentRole === 'admin' ? 'member' : 'admin');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : dict.settings.failedToChangeRole);
      } finally {
        setBusyId(null);
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
          <li key={a.id} className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="truncate text-sm">
              {a.email}
              {a.role === 'admin' && (
                <span className="ml-1.5 rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] text-ink/60">
                  {dict.settings.roleAdmin}
                </span>
              )}
            </span>
            <div className="flex shrink-0 gap-2">
              {canManageRoles && (
                <button
                  type="button"
                  onClick={() => toggleAdmin(a.id, a.role)}
                  disabled={isPending && busyId === a.id}
                  className="rounded-lg border border-ink/15 px-3 py-1 text-xs hover:bg-ink/5 disabled:opacity-50"
                >
                  {a.role === 'admin' ? dict.settings.revokeAdmin : dict.settings.makeAdmin}
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(a.id, a.email)}
                disabled={isPending && busyId === a.id}
                className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {isPending && busyId === a.id ? dict.settings.removing : dict.settings.remove}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
