import { supabase } from '@/lib/supabaseClient';
import type { Book } from '@/lib/types';
import BookCard from '@/components/BookCard';

export const dynamic = 'force-dynamic';

export default async function ShelfPage() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('date_read', { ascending: false });

  if (error) {
    return <p className="text-red-600">Failed to load books: {error.message}</p>;
  }

  if (!books || books.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink/20 p-12 text-center text-ink/60">
        <p className="mb-2 text-lg">Your shelf is empty.</p>
        <p className="text-sm">Add your first book to get started.</p>
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
