export type CoverSource = 'api' | 'self-uploaded';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string;
  cover_source: CoverSource;
  spine_url: string | null;
  date_read: string;
  rating: number | null;
  notes: string | null;
  created_at?: string;
}

export interface CoverCandidate {
  source: 'openlibrary' | 'googlebooks';
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string;
}
