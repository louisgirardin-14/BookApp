import 'server-only';
import type { CoverCandidate } from './types';

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
  return (data.docs ?? [])
    .filter((doc) => doc.cover_i)
    .map((doc) => ({
      source: 'openlibrary' as const,
      title: doc.title,
      author: doc.author_name?.[0] ?? 'Unknown',
      isbn: doc.isbn?.[0] ?? null,
      coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
    }));
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
  return (data.items ?? [])
    .filter((item) => item.volumeInfo?.imageLinks?.thumbnail)
    .map((item) => {
      const info = item.volumeInfo!;
      const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13');
      const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10');
      return {
        source: 'googlebooks' as const,
        title: info.title ?? 'Unknown title',
        author: info.authors?.[0] ?? 'Unknown',
        isbn: (isbn13 ?? isbn10)?.identifier ?? null,
        coverUrl: (info.imageLinks!.thumbnail ?? info.imageLinks!.smallThumbnail!).replace(
          'http://',
          'https://'
        ),
      };
    });
}

// Query Open Library first; if it returns nothing with a cover, fall back
// to Google Books. Both are keyless public APIs.
export async function searchBookCovers(query: string): Promise<CoverCandidate[]> {
  const openLibraryResults = await searchOpenLibrary(query);
  if (openLibraryResults.length > 0) return openLibraryResults;
  return searchGoogleBooks(query);
}
