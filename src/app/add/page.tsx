'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CoverSource } from '@/lib/types';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import StarRating from '@/components/StarRating';
import CoverPicker, { type CoverPickResult } from '@/components/CoverPicker';
import { addBook, findDuplicateBook, mirrorCoverImage, uploadCoverImage } from '@/app/actions';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddBookPage() {
  const router = useRouter();
  const { dict } = useLocale();

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverSource, setCoverSource] = useState<CoverSource | null>(null);

  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    date_read: todayISO(),
    rating: null as number | null,
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function onCoverSelected(result: CoverPickResult) {
    setCoverUrl(result.url);
    setCoverSource(result.source);
    setForm((f) => ({
      ...f,
      title: result.title ?? f.title,
      author: result.author ?? f.author,
      isbn: result.isbn ?? f.isbn,
    }));
  }

  async function save() {
    if (!coverUrl || !coverSource) return;
    if (!form.title.trim() || !form.author.trim()) {
      setSaveError(dict.addBook.titleAuthorRequired);
      return;
    }
    const duplicate = await findDuplicateBook(form.title, form.author);
    if (duplicate) {
      const confirmed = confirm(dict.addBook.duplicateConfirm(form.title, duplicate.date_read));
      if (!confirmed) return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      // Whatever the source, end up with our own Supabase Storage URL so
      // the book no longer depends on a third-party CDN staying up.
      const finalCoverUrl =
        coverSource === 'self-uploaded'
          ? await uploadCoverImage(coverUrl, form.title)
          : await mirrorCoverImage(coverUrl, form.title);

      const id = await addBook({
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim() || null,
        cover_url: finalCoverUrl,
        cover_source: coverSource,
        spine_url: null,
        date_read: form.date_read,
        rating: form.rating,
        notes: form.notes.trim() || null,
      });
      router.push(`/book/${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : dict.addBook.failedToSave);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">{dict.addBook.heading}</h1>

      {!coverUrl && <CoverPicker onSelected={onCoverSelected} />}

      {coverUrl && (
        <section className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="relative aspect-[2/3] w-32 overflow-hidden rounded-lg border border-ink/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt={dict.addBook.selectedCoverAlt}
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCoverUrl(null);
                setCoverSource(null);
              }}
              className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5"
            >
              {dict.addBook.changeCover}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">
              {dict.addBook.titleLabel}
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">
              {dict.addBook.authorLabel}
            </label>
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">
              {dict.addBook.isbnLabel}
            </label>
            <input
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">
              {dict.addBook.dateReadLabel}
            </label>
            <input
              type="date"
              value={form.date_read}
              onChange={(e) => setForm({ ...form, date_read: e.target.value })}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">
              {dict.addBook.ratingLabel}
            </label>
            <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">
              {dict.addBook.notesLabel}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-ink/15 px-3 py-2"
            />
          </div>

          {saveError && <p className="text-sm text-red-600">{saveError}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-ink px-5 py-2.5 text-sm text-cream hover:opacity-90 disabled:opacity-50"
          >
            {saving ? dict.addBook.saving : dict.addBook.saveToShelf}
          </button>
        </section>
      )}
    </div>
  );
}
