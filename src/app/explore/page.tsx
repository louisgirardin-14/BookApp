import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('is_public', true)
    .neq('id', user.id)
    .order('email', { ascending: true });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Explore</h1>
      <p className="text-sm text-ink/60">Public shelves from other accounts, read-only.</p>

      {!profiles || profiles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/20 p-8 text-center text-sm text-ink/60">
          Nobody has made their shelf public yet.
        </p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
          {profiles.map((p) => (
            <li key={p.id}>
              <Link href={`/u/${p.id}`} className="block px-4 py-3 text-sm hover:bg-ink/5">
                {p.email}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
