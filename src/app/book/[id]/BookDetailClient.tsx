'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Book } from '@/lib/types';
import StarRating from '@/components/StarRating';
import CoverPicker, { type CoverPickResult } from '@/components/CoverPicker';
import { deleteBook, mirrorCoverImage, updateBook, uploadCoverImage } from '@/app/actions';

const SPINE_ASPECT = 1 / 5;
const SPINE_OUTPUT_SIZE = { width: 300, height: 1500 };

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

  const [changingCover, setChangingCover] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const [addingSpine, setAddingSpine] = useState(false);
  const [spineBusy, setSpineBusy] = useState(false);
  const [spineError, setSpineError] = useState<string | null>(null);

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

  async function onCoverSelected(result: CoverPickResult) {
    setCoverBusy(true);
    setCoverError(null);
    try {
      const finalUrl =
        result.source === 'self-uploaded'
          ? await uploadCoverImage(result.url, book.title)
          : await mirrorCoverImage(result.url, book.title);
      await updateBook(book.id, { cover_url: finalUrl, cover_source: result.source });
      setChangingCover(false);
      router.refresh();
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Failed to update cover.');
    } finally {
      setCoverBusy(false);
    }
  }

  async function onSpineSelected(result: CoverPickResult) {
    setSpineBusy(true);
    setSpineError(null);
    try {
      const finalUrl = await uploadCoverImage(result.url, `${book.title}-spine`);
      await updateBook(book.id, { spine_url: finalUrl });
      setAddingSpine(false);
      router.refresh();
    } catch (err) {
      setSpineError(err instanceof Error ? err.message : 'Failed to save spine photo.');
    } finally {
      setSpineBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-[240px_1fr]">
      <div className="space-y-3">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
          <Image src={book.cover_url} alt={book.title} fill className="object-cover" unoptimized />
        </div>

        {!changingCover ? (
          <button
            type="button"
            onClick={() => setChangingCover(true)}
            className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5"
          >
            Change cover
          </button>
        ) : (
          <div className="rounded-lg border border-ink/10 bg-white p-3">
            {coverBusy ? (
              <p className="text-sm text-ink/60">Saving cover...</p>
            ) : (
              <CoverPicker onSelected={onCoverSelected} />
            )}
            {coverError && <p className="mt-2 text-sm text-red-600">{coverError}</p>}
            <button
              type="button"
              onClick={() => setChangingCover(false)}
              className="mt-2 text-sm text-ink/60 hover:text-ink"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="rounded-lg border border-ink/10 bg-white p-3">
          <p className="mb-2 text-xs font-medium text-ink/60">Spine photo</p>
          {book.spine_url && !addingSpine && (
            <div className="relative mb-2 h-24 w-full overflow-hidden rounded border border-ink/10 bg-ink/5">
              <Image src={book.spine_url} alt={`${book.title} spine`} fill className="object-cover" unoptimized />
            </div>
          )}

          {!addingSpine ? (
            <button
              type="button"
              onClick={() => setAddingSpine(true)}
              className="w-full rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5"
            >
              {book.spine_url ? 'Replace spine photo' : 'Add spine photo'}
            </button>
          ) : spineBusy ? (
            <p className="text-sm text-ink/60">Saving spine photo...</p>
          ) : (
            <>
              <CoverPicker
                hideSearch
                aspect={SPINE_ASPECT}
                outputSize={SPINE_OUTPUT_SIZE}
                photoButtonLabel="Take a photo of the spine"
                onSelected={onSpineSelected}
              />
              {spineError && <p className="mt-2 text-sm text-red-600">{spineError}</p>}
              <button
                type="button"
                onClick={() => setAddingSpine(false)}
                className="mt-2 text-sm text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
            </>
          )}
        </div>
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
