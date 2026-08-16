'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Book } from '@/lib/types';
import StarRating from '@/components/StarRating';
import { deleteBook, updateBook } from '@/app/actions';

export default function BookDetailClient({ book }: { book: Book }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? '',
    date_read: book.date_read,
    rating: book.rating,
    notes: book.notes ?? '',
  });

  function save() {
    startTransition(async () => {
      await updateBook(book.id, {
        title: form.title,
        author: form.author,
        isbn: form.isbn || null,
        date_read: form.date_read,
        rating: form.rating,
        notes: form.notes || null,
      });
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm(`Delete "${book.title}" from your shelf?`)) return;
    startTransition(async () => {
      await deleteBook(book.id);
      router.push('/');
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-[240px_1fr]">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <Image src={book.cover_url} alt={book.title} fill className="object-cover" unoptimized />
      </div>

      <div>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Author</label>
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">ISBN</label>
              <input
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Date read</label>
              <input
                type="date"
                value={form.date_read}
                onChange={(e) => setForm({ ...form, date_read: e.target.value })}
                className="w-full rounded-lg border border-ink/15 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Rating</label>
              <StarRating
                value={form.rating}
                onChange={(rating) => setForm({ ...form, rating })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink/60">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-ink/15 px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={isPending}
                className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold">{book.title}</h1>
            <p className="mb-3 text-ink/60">{book.author}</p>
            <StarRating value={book.rating} />
            <p className="mt-3 text-sm text-ink/60">
              Read on {new Date(book.date_read + 'T00:00:00').toLocaleDateString()}
            </p>
            {book.isbn && <p className="mt-1 text-sm text-ink/60">ISBN: {book.isbn}</p>}
            {book.notes && <p className="mt-4 whitespace-pre-wrap text-sm">{book.notes}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90"
              >
                Edit
              </button>
              <button
                onClick={remove}
                disabled={isPending}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
