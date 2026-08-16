'use client';

import { useState } from 'react';
import { claimOwnerAccount } from './actions';

export default function ClaimOwnerForm({
  next,
  initiallyOpen = false,
}: {
  next: string;
  initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full text-center text-sm text-ink/60 underline hover:text-ink"
      >
        First time here, or password not working? Set it up.
      </button>
    );
  }

  return (
    <form action={claimOwnerAccount} className="mt-4 space-y-3 border-t border-ink/10 pt-4">
      <input type="hidden" name="next" value={next} />
      <p className="text-sm text-ink/60">
        Sets the owner account&apos;s password directly. Only works before that account has
        signed in for the first time.
      </p>
      <input
        type="password"
        name="password"
        placeholder="New password"
        required
        className="w-full rounded-lg border border-ink/15 px-3 py-2"
      />
      <input
        type="password"
        name="confirm"
        placeholder="Confirm password"
        required
        className="w-full rounded-lg border border-ink/15 px-3 py-2"
      />
      <button
        type="submit"
        className="w-full rounded-lg border border-ink/15 py-2 text-sm hover:bg-ink/5"
      >
        Set password & sign in
      </button>
    </form>
  );
}
