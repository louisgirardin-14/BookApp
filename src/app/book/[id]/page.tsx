import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Book } from '@/lib/types';
import BookDetailClient from './BookDetailClient';

export const dynamic = 'force-dynamic';

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!book) notFound();

  const isOwner = book.user_id === user.id;

  return <BookDetailClient book={book as Book} isOwner={isOwner} />;
}
