import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/getLocale';
import type { Book } from '@/lib/types';
import BookCard from '@/components/BookCard';

export const dynamic = 'force-dynamic';

export default async function PublicShelfPage({ params }: { params: { userId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const dict = getDictionary();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, is_public')
    .eq('id', params.userId)
    .maybeSingle();

  if (!profile || (!profile.is_public && profile.id !== user.id)) notFound();

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', params.userId)
    .order('date_read', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{dict.publicShelf.shelfHeading(profile.email ?? '')}</h1>
        <p className="text-sm text-ink/60">{dict.publicShelf.readOnly}</p>
      </div>

      {!books || books.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/60">
          <p>{dict.publicShelf.noBooksYet}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(books as Book[]).map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
