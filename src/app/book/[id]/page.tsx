import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { Book } from '@/lib/types';
import BookDetailClient from './BookDetailClient';

export const dynamic = 'force-dynamic';

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!book) notFound();

  return <BookDetailClient book={book as Book} />;
}
