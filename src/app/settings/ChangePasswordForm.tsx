'use client';

import { useState, useTransition } from 'react';
import { changeOwnPassword } from './actions';

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    startTransition(async () => {
      try {
        await changeOwnPassword(password);
        setMessage('Password updated.');
        setPassword('');
        setConfirm('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to change password.');
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        required
        className="w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Update password'}
      </button>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
