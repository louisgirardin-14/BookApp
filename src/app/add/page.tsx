'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CoverCandidate, CoverSource } from '@/lib/types';
import StarRating from '@/components/StarRating';
import CameraCapture from '@/components/CameraCapture';
import AutoCropStage from '@/components/AutoCropStage';
import { addBook, uploadCoverImage } from '@/app/actions';

type Flow = 'idle' | 'camera' | 'crop';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddBookPage() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CoverCandidate[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [flow, setFlow] = useState<Flow>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

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

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/search-covers?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      if (!data.results?.length) {
        setSearchError('No covers found. You can take a photo instead.');
      }
    } catch {
      setSearchError('Search failed. Try again.');
    } finally {
      setSearching(false);
    }
  }

  function pickCandidate(candidate: CoverCandidate) {
    setCoverUrl(candidate.coverUrl);
    setCoverSource('api');
    setForm((f) => ({
      ...f,
      title: candidate.title,
      author: candidate.author,
      isbn: candidate.isbn ?? f.isbn,
    }));
  }

  function onCropConfirmed(dataUrl: string) {
    setCoverUrl(dataUrl);
    setCoverSource('self-uploaded');
    setFlow('idle');
    setCapturedImage(null);
  }

  async function save() {
    if (!coverUrl || !coverSource) return;
    if (!form.title.trim() || !form.author.trim()) {
      setSaveError('Title and author are required.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      let finalCoverUrl = coverUrl;
      if (coverSource === 'self-uploaded') {
        finalCoverUrl = await uploadCoverImage(coverUrl, form.title);
      }
      const id = await addBook({
        title: form.title.trim(),
        author: form.author.trim(),
        isbn: form.isbn.trim() || null,
        cover_url: finalCoverUrl,
        cover_source: coverSource,
        date_read: form.date_read,
        rating: form.rating,
        notes: form.notes.trim() || null,
      });
      router.push(`/book/${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Add a book</h1>

      {!coverUrl && (
        <section className="space-y-4">
          <form onSubmit={search} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, author, or ISBN"
              className="flex-1 rounded-lg border border-ink/15 px-3 py-2"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchError && <p className="text-sm text-ink/60">{searchError}</p>}

          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {results.map((candidate, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickCandidate(candidate)}
                  className="group text-left"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-lg border border-ink/10 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={candidate.coverUrl}
                      alt={candidate.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-1 truncate text-xs">{candidate.title}</p>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-ink/10 pt-4">
            {flow === 'idle' && (
              <button
                type="button"
                onClick={() => setFlow('camera')}
                className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
              >
                No cover found — take a photo
              </button>
            )}
            {flow === 'camera' && (
              <CameraCapture
                onCapture={(dataUrl) => {
                  setCapturedImage(dataUrl);
                  setFlow('crop');
                }}
                onCancel={() => setFlow('idle')}
              />
            )}
            {flow === 'crop' && capturedImage && (
              <AutoCropStage
                capturedImage={capturedImage}
                onConfirm={onCropConfirmed}
                onRetake={() => setFlow('camera')}
              />
            )}
          </div>
        </section>
      )}

      {coverUrl && (
        <section className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="relative aspect-[2/3] w-32 overflow-hidden rounded-lg border border-ink/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt="Selected cover" className="h-full w-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => {
                setCoverUrl(null);
                setCoverSource(null);
              }}
              className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm hover:bg-ink/5"
            >
              Change cover
            </button>
          </div>

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
            <label className="mb-1 block text-xs font-medium text-ink/60">ISBN (optional)</label>
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
            <label className="mb-1 block text-xs font-medium text-ink/60">Rating (optional)</label>
            <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/60">Notes (optional)</label>
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
            {saving ? 'Saving...' : 'Save to shelf'}
          </button>
        </section>
      )}
    </div>
  );
}
