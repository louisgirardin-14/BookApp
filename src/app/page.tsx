import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDictionary } from '@/lib/i18n/getLocale';
import type { Book } from '@/lib/types';
import BookCard from '@/components/BookCard';

export const dynamic = 'force-dynamic';

export default async function ShelfPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const dict = getDictionary();

  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', user.id)
    .order('date_read', { ascending: false });

  if (error) {
    return (
      <p className="text-red-600">
        {dict.shelf.failedToLoad} {error.message}
      </p>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/60">
        <p className="mb-2 text-lg">{dict.shelf.emptyTitle}</p>
        <p className="text-sm">{dict.shelf.emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {(books as Book[]).map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
