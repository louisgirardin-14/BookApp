'use client';

import { useRef, useState } from 'react';
import type { Book } from '@/lib/types';
import { EXPORT_THEMES, EXPORT_WIDTH, EXPORT_HEIGHT, type ThemeId, type LayoutId } from '@/lib/exportThemes';
import { renderExportCanvas } from '@/lib/renderExport';

type RangeMode = 'this-month' | 'last-month' | 'custom';

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthRange(offset: number) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return {
    from: toISO(from),
    to: toISO(to),
    title: `${from.toLocaleString('en-US', { month: 'long' })} Reads`,
  };
}

export default function ExportPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rangeMode, setRangeMode] = useState<RangeMode>('this-month');
  const [customFrom, setCustomFrom] = useState(
    toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  );
  const [customTo, setCustomTo] = useState(toISO(new Date()));
  const [themeId, setThemeId] = useState<ThemeId>('cream');
  const [layout, setLayout] = useState<LayoutId>('grid');
  const [handwrittenTitle, setHandwrittenTitle] = useState(false);
  const [poeticCaption, setPoeticCaption] = useState(false);
  const [scrapbookPhotos, setScrapbookPhotos] = useState(false);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function currentRange() {
    if (rangeMode === 'this-month') return monthRange(0);
    if (rangeMode === 'last-month') return monthRange(-1);
    return { from: customFrom, to: customTo, title: 'Reading' };
  }

  async function loadAndRender() {
    setBusy(true);
    setError(null);
    try {
      const { from, to, title } = currentRange();
      const res = await fetch(`/api/books-for-export?from=${from}&to=${to}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const fetchedBooks: Book[] = data.books ?? [];
      setBooks(fetchedBooks);

      const theme = EXPORT_THEMES.find((t) => t.id === themeId)!;
      const canvas = canvasRef.current;
      const count = fetchedBooks.length;
      if (canvas) {
        await renderExportCanvas(canvas, fetchedBooks, {
          theme,
          layout,
          title,
          subtitle: `${count} ${count === 1 ? 'book' : 'books'}`,
          handwrittenTitle,
          poeticCaption,
          scrapbookPhotos: scrapbookPhotos && layout === 'grid',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate export.');
    } finally {
      setBusy(false);
    }
  }

  function getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  // On iOS/Android, `<a download>` with a data: URL is unreliable and often
  // doesn't reach Photos at all. The native share sheet's "Save Image"
  // option is the standard, reliable way to get an image into Photos on
  // mobile web -- and it also lets the user pick Instagram directly.
  async function saveImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await getCanvasBlob(canvas);
    if (!blob) return;

    const file = new File([blob], 'shelf-export.png', { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        // User cancelled the share sheet, or share failed -- fall back
        // to a classic download link below.
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'shelf-export.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Playfair+Display:ital@1&display=swap"
        rel="stylesheet"
      />

      <h1 className="text-2xl font-semibold">Export</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Date range</label>
          <select
            value={rangeMode}
            onChange={(e) => setRangeMode(e.target.value as RangeMode)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
          >
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="custom">Custom range</option>
          </select>
          {rangeMode === 'custom' && (
            <div className="mt-2 flex gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2"
              />
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-lg border border-ink/15 px-3 py-2"
              />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Layout</label>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value as LayoutId)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2"
          >
            <option value="grid">Grid of covers</option>
            <option value="spines">Spines</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-ink/60">Theme</label>
        <div className="flex gap-3">
          {EXPORT_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemeId(t.id)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                themeId === t.id ? 'border-ink ring-2 ring-ink/30' : 'border-ink/15'
              }`}
              style={{ background: t.background, color: t.textColor }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-ink/60">Bookish touches</label>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={handwrittenTitle}
              onChange={(e) => setHandwrittenTitle(e.target.checked)}
            />
            Handwritten title
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={poeticCaption}
              onChange={(e) => setPoeticCaption(e.target.checked)}
            />
            Poetic caption
          </label>
          <label className={`flex items-center gap-2 ${layout !== 'grid' ? 'opacity-40' : ''}`}>
            <input
              type="checkbox"
              checked={scrapbookPhotos}
              disabled={layout !== 'grid'}
              onChange={(e) => setScrapbookPhotos(e.target.checked)}
            />
            Scrapbook photos {layout !== 'grid' && '(grid only)'}
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={loadAndRender}
          disabled={busy}
          className="rounded-lg bg-ink px-4 py-2 text-sm text-cream hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Generating...' : 'Generate preview'}
        </button>
        {books && books.length > 0 && (
          <button
            type="button"
            onClick={saveImage}
            className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
          >
            Save / Share
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        <canvas ref={canvasRef} width={EXPORT_WIDTH} height={EXPORT_HEIGHT} className="w-full" />
      </div>
    </div>
  );
}
