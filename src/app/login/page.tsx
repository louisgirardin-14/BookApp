import { getDictionary } from '@/lib/i18n/getLocale';
import { signIn } from './actions';
import ClaimOwnerForm from './ClaimOwnerForm';
import OAuthButtons from '@/components/OAuthButtons';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; claim?: string };
}) {
  const next = searchParams.next ?? '/';
  const dict = getDictionary();

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-ink">{dict.login.appName}</h1>
        <p className="mb-6 text-sm text-ink/60">{dict.login.subtitle}</p>

        <form action={signIn} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <input
            type="email"
            name="email"
            placeholder={dict.login.email}
            required
            autoFocus
            className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-ink/40"
          />
          <input
            type="password"
            name="password"
            placeholder={dict.login.password}
            required
            className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-ink/40"
          />
          {searchParams.error && (
            <p className="text-sm text-red-600">{decodeURIComponent(searchParams.error)}</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-ink py-2 text-cream transition hover:opacity-90"
          >
            {dict.login.signIn}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
          <div className="h-px flex-1 bg-ink/10" />
          {dict.login.or}
          <div className="h-px flex-1 bg-ink/10" />
        </div>
        <OAuthButtons next={next} />

        <ClaimOwnerForm next={next} initiallyOpen={searchParams.claim === '1'} />
      </div>
    </main>
  );
}
