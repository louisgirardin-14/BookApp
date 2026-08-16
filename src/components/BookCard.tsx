import Image from 'next/image';
import Link from 'next/link';
import type { Book } from '@/lib/types';

export default function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/book/${book.id}`}
      className="group block overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[2/3] w-full bg-ink/5">
        <Image
          src={book.cover_url}
          alt={book.title}
          fill
          sizes="(max-width: 768px) 50vw, 200px"
          className="object-cover transition group-hover:scale-[1.02]"
          unoptimized
        />
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium">{book.title}</p>
        <p className="truncate text-xs text-ink/60">{book.author}</p>
      </div>
    </Link>
  );
}
