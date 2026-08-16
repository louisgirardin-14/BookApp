import { signIn } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? '/';

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-semibold text-ink">Shelf</h1>
        <p className="mb-6 text-sm text-ink/60">Sign in to your shelf.</p>

        <form action={signIn} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            autoFocus
            className="w-full rounded-lg border border-ink/15 px-3 py-2 outline-none focus:border-ink/40"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
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
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
