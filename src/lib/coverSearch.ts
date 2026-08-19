import 'server-only';
import type { CoverCandidate } from './types';

function normalizeIsbn(raw: string): string | null {
  const cleaned = raw.replace(/[-\s]/g, '').toUpperCase();
  if (/^\d{9}[\dX]$/.test(cleaned) || /^\d{13}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  edition_key?: string[];
}

async function searchOpenLibrary(query: string): Promise<CoverCandidate[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=title,author_name,isbn,cover_i`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  // Keep matches even when Open Library's index has no cover image for
  // them -- foreign-language and small-press editions are often missing a
  // cover_i despite the title/author being a real, correct match. Dropping
  // them here made real books look like they "don't exist" in the app.
  return (data.docs ?? []).map((doc) => ({
    source: 'openlibrary' as const,
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Unknown',
    isbn: doc.isbn?.[0] ?? null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
  }));
}

interface OpenLibraryBookData {
  title: string;
  authors?: { name: string }[];
  cover?: { small?: string; medium?: string; large?: string };
}

// Open Library's general search index misses many editions (especially
// small-press/regional ones). Its dedicated ISBN lookup is far more
// reliable for exact-ISBN matches.
async function lookupOpenLibraryByIsbn(isbn: string): Promise<CoverCandidate[]> {
  const res = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, OpenLibraryBookData>;
  const entry = data[`ISBN:${isbn}`];
  if (!entry) return [];
  return [
    {
      source: 'openlibrary' as const,
      title: entry.title,
      author: entry.authors?.[0]?.name ?? 'Unknown',
      isbn,
      coverUrl: entry.cover
        ? (entry.cover.large ?? entry.cover.medium ?? entry.cover.small ?? null)
        : null,
    },
  ];
}

interface GoogleVolume {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

async function searchGoogleBooks(query: string): Promise<CoverCandidate[]> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`,
    { cache: 'no-store' }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: GoogleVolume[] };
  // As with Open Library, surface matches even without a cover image --
  // an obscure or foreign edition missing artwork is still a real match,
  // and hiding it made the app look like it had a gap in its data.
  return (data.items ?? [])
    .filter((item) => item.volumeInfo?.title)
    .map((item) => {
      const info = item.volumeInfo!;
      const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13');
      const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10');
      const thumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;
      return {
        source: 'googlebooks' as const,
        title: info.title ?? 'Unknown title',
        author: info.authors?.[0] ?? 'Unknown',
        isbn: (isbn13 ?? isbn10)?.identifier ?? null,
        coverUrl: thumb ? thumb.replace('http://', 'https://') : null,
      };
    });
}

// If the query is ISBN-shaped, use each provider's exact-ISBN lookup
// (far more reliable than a raw text search) before falling back to a
// general title/author search. Open Library is tried first, then Google
// Books, matching the brief's stated provider priority.
export async function searchBookCovers(query: string): Promise<CoverCandidate[]> {
  const isbn = normalizeIsbn(query);
  if (isbn) {
    const olResults = await lookupOpenLibraryByIsbn(isbn);
    if (olResults.length > 0) return olResults;

    const gbResults = await searchGoogleBooks(`isbn:${isbn}`);
    if (gbResults.length > 0) return gbResults;

    return [];
  }

  // Query both providers and merge results, rather than only falling back
  // to Google Books when Open Library returns zero results -- Open
  // Library's search index can list a cover_i whose image is individually
  // stale or slow, so having Google Books candidates alongside gives the
  // user something to fall back to even when Open Library "succeeded" but
  // some of its cover links don't actually load.
  const [openLibraryResults, googleResults] = await Promise.all([
    searchOpenLibrary(query).catch(() => []),
    searchGoogleBooks(query).catch(() => []),
  ]);
  // Covered matches make the nicest tiles, so show them first; coverless
  // matches (still real, still pickable) sort to the end rather than
  // being dropped.
  return [...openLibraryResults, ...googleResults].sort(
    (a, b) => Number(b.coverUrl !== null) - Number(a.coverUrl !== null)
  );
}
