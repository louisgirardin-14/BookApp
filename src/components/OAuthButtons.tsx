'use client';

import { createClient } from '@/lib/supabase/client';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function OAuthButtons({ next }: { next: string }) {
  const { dict } = useLocale();

  function signInWith(provider: 'google' | 'apple') {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => signInWith('google')}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink/15 py-2 text-sm hover:bg-ink/5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.89c2.27-2.09 3.58-5.17 3.58-8.87z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.89-3c-1.08.72-2.46 1.16-4.04 1.16-3.1 0-5.73-2.09-6.67-4.9H1.32v3.09A12 12 0 0 0 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.33 14.35a7.2 7.2 0 0 1 0-4.7V6.56H1.32a12 12 0 0 0 0 10.88l4.01-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.45-3.45C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.32 6.56l4.01 3.09c.94-2.81 3.57-4.9 6.67-4.9z"
          />
        </svg>
        {dict.login.continueWithGoogle}
      </button>
      <button
        type="button"
        onClick={() => signInWith('apple')}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-ink/15 py-2 text-sm hover:bg-ink/5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16.36 1.43c0 1.14-.42 2.2-1.15 3.02-.83.94-2.02 1.61-3.13 1.52a3.5 3.5 0 0 1 1.03-2.9c.83-.9 2.19-1.55 3.25-1.64.02.13.03.27.03.4zM20.6 17.2c-.53 1.22-.78 1.77-1.46 2.85-.95 1.51-2.28 3.39-3.94 3.41-1.47.02-1.85-.96-3.85-.95-1.99.01-2.41.97-3.88.95-1.66-.02-2.92-1.72-3.87-3.23-2.65-4.2-2.93-9.13-1.29-11.76 1.16-1.87 3-2.97 4.72-2.97 1.75 0 2.85.99 4.3.99 1.4 0 2.26-.99 4.28-.99 1.53 0 3.15.83 4.3 2.27-3.78 2.07-3.17 7.46.69 9.43z" />
        </svg>
        {dict.login.continueWithApple}
      </button>
    </div>
  );
}
