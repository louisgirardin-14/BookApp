'use client';

import { useState, useTransition } from 'react';
import { inviteFriend } from './actions';

export default function InviteFriendForm() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await inviteFriend(email);
        setMessage(`Invite sent to ${email}.`);
        setEmail('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send invite.');
      }
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          required
          className="flex-1 rounded-lg border border-ink/15 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? 'Sending...' : 'Invite'}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
