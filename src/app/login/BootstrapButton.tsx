'use client';

import { useState, useTransition } from 'react';
import { bootstrapOwnerAccess } from './actions';

export default function BootstrapButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const link = await bootstrapOwnerAccess();
        window.location.href = link;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get an access link.');
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-lg border border-ink/15 py-2 text-sm hover:bg-ink/5 disabled:opacity-50"
      >
        {isPending ? 'Getting link...' : "I'm the owner — get me in"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
