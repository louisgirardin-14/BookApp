'use client';

import { useState, useTransition } from 'react';
import { inviteFriend } from './actions';

export default function InviteFriendForm() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLink(null);
    setCopied(false);
    setError(null);
    startTransition(async () => {
      try {
        const result = await inviteFriend(email);
        setLink(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create invite.');
      }
    });
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
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
          {isPending ? 'Creating...' : 'Invite'}
        </button>
      </form>

      {link && (
        <div className="mt-3 space-y-2 rounded-lg border border-ink/10 bg-cream p-3">
          <p className="text-sm text-ink/60">
            Send this link to your friend directly (text, WhatsApp, etc.) — no email needed.
          </p>
          <p className="break-all rounded border border-ink/10 bg-white p-2 text-xs">{link}</p>
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
