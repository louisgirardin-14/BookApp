'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-ink">Set your password</h1>
        {!ready ? (
          <p className="text-sm text-ink/60">Verifying your invite link...</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm text-ink/60">Choose a password for your account.</p>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-ink py-2 text-cream hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Set password & continue'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
