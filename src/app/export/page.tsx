'use client';

import { useRef, useState } from 'react';
import type { Book } from '@/lib/types';
import { EXPORT_THEMES, EXPORT_WIDTH, EXPORT_HEIGHT, type ThemeId, type LayoutId } from '@/lib/exportThemes';
import { TIMELINE_THEMES, type TimelineThemeId } from '@/lib/timelineThemes';
import { renderExportCanvas } from '@/lib/renderExport';
import type { ConnectorStyle } from '@/lib/timelinePath';

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
  const [timelineThemeId, setTimelineThemeId] = useState<TimelineThemeId>('mustard');
  const [layout, setLayout] = useState<LayoutId>('grid');
  const [connectorStyle, setConnectorStyle] = useState<ConnectorStyle>('wave');
  const [books, setBooks] = useState<Book[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function currentRange() {
    if (rangeMode === 'this-month') return monthRange(0);
    if (rangeMode === 'last-month') return monthRange(-1);
    return { from: customFrom, to: customTo, title: 'Reading' };
  }

  // The Timeline layout is rendered server-side via Satori (next/og) --
  // fetch the PNG and paint it onto the same canvas the rest of the page
  // treats as the preview/save surface, so Save/Share doesn't need to care
  // which layout produced the pixels.
  async function renderTimeline(canvas: HTMLCanvasElement, fetchedBooks: Book[]) {
    const res = await fetch('/api/export-timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        books: fetchedBooks.map((b) => ({ cover_url: b.cover_url, date_read: b.date_read })),
        themeId: timelineThemeId,
        connectorStyle,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? 'Failed to generate timeline image.');
    }
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(bitmap, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
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

      const canvas = canvasRef.current;
      if (!canvas) return;

      if (layout === 'timeline') {
        await renderTimeline(canvas, fetchedBooks);
      } else {
        const theme = EXPORT_THEMES.find((t) => t.id === themeId)!;
        const count = fetchedBooks.length;
        await renderExportCanvas(canvas, fetchedBooks, {
          theme,
          layout,
          title,
          subtitle: `${count} ${count === 1 ? 'book' : 'books'}`,
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
            <option value="timeline">Timeline (winding path)</option>
          </select>
        </div>
      </div>

      {layout === 'timeline' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink/60">Connector</label>
          <select
            value={connectorStyle}
            onChange={(e) => setConnectorStyle(e.target.value as ConnectorStyle)}
            className="w-full rounded-lg border border-ink/15 px-3 py-2 sm:w-56"
          >
            <option value="wave">Wave</option>
            <option value="zigzag">Zigzag</option>
            <option value="straight">Straight</option>
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-medium text-ink/60">Theme</label>
        <div className="flex flex-wrap gap-3">
          {layout === 'timeline'
            ? TIMELINE_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimelineThemeId(t.id)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    timelineThemeId === t.id ? 'border-ink ring-2 ring-ink/30' : 'border-ink/15'
                  }`}
                  style={{ background: t.background, color: t.textColor }}
                >
                  {t.label}
                </button>
              ))
            : EXPORT_THEMES.map((t) => (
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
