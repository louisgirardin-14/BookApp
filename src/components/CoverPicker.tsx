'use client';

import { useState } from 'react';
import type { CoverCandidate, CoverSource } from '@/lib/types';
import CameraCapture from './CameraCapture';
import AutoCropStage from './AutoCropStage';

type Flow = 'idle' | 'camera' | 'crop';

export interface CoverPickResult {
  // A remote URL (api candidate) or a data: URL (camera capture) --
  // not yet persisted. The caller decides when/how to save it.
  url: string;
  source: CoverSource;
  title?: string;
  author?: string;
  isbn?: string | null;
}

// Reusable cover-selection flow: search Open Library/Google Books, or
// take a photo with camera capture -> OpenCV auto-crop -> manual crop
// override. Used by both the Add Book page and the book detail page's
// "change cover" / "add spine photo" actions.
export default function CoverPicker({
  aspect = 2 / 3,
  outputSize,
  hideSearch = false,
  photoButtonLabel,
  onSelected,
}: {
  aspect?: number;
  outputSize?: { width: number; height: number };
  hideSearch?: boolean;
  photoButtonLabel?: string;
  onSelected: (result: CoverPickResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CoverCandidate[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [brokenIndices, setBrokenIndices] = useState<Set<number>>(new Set());

  const [flow, setFlow] = useState<Flow>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setBrokenIndices(new Set());
    setResults([]);
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
    onSelected({
      url: candidate.coverUrl,
      source: 'api',
      title: candidate.title,
      author: candidate.author,
      isbn: candidate.isbn,
    });
  }

  function onCropConfirmed(dataUrl: string) {
    onSelected({ url: dataUrl, source: 'self-uploaded' });
  }

  return (
    <div className="space-y-4">
      {!hideSearch && (
        <>
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

          {results.some((_, i) => !brokenIndices.has(i)) && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {results.map((candidate, i) =>
                brokenIndices.has(i) ? null : (
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
                        onError={() =>
                          setBrokenIndices((prev) => new Set(prev).add(i))
                        }
                      />
                    </div>
                    <p className="mt-1 truncate text-xs">{candidate.title}</p>
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}

      <div className={hideSearch ? '' : 'border-t border-ink/10 pt-4'}>
        {flow === 'idle' && (
          <button
            type="button"
            onClick={() => setFlow('camera')}
            className="rounded-lg border border-ink/15 px-4 py-2 text-sm hover:bg-ink/5"
          >
            {photoButtonLabel ?? (hideSearch ? 'Take a photo' : 'No cover found — take a photo')}
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
            aspect={aspect}
            outputSize={outputSize}
            onConfirm={onCropConfirmed}
            onRetake={() => setFlow('camera')}
          />
        )}
      </div>
    </div>
  );
}
