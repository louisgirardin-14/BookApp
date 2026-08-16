'use client';

import { useState, useTransition } from 'react';
import { bootstrapOwnerInvite } from './actions';

export default function BootstrapButton() {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await bootstrapOwnerInvite();
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send invite.');
      }
    });
  }

  if (done) {
    return (
      <p className="text-sm text-green-700">
        Invite sent — check your email and follow the link to set your password.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full rounded-lg bg-ink py-2 text-cream transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? 'Sending...' : 'Send me an invite'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
