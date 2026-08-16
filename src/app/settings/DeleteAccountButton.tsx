'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteAccount } from './actions';

export default function DeleteAccountButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm('Permanently delete your account, books, and photos? This cannot be undone.')) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteAccount();
        router.push('/login');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete account.');
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
        {isPending ? 'Deleting...' : 'Delete my account'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
