import { NextResponse } from 'next/server';
import { searchBookCovers } from '@/lib/coverSearch';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchBookCovers(q);
  return NextResponse.json({ results });
}
