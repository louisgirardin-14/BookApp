import { NextResponse } from 'next/server';

// Proxies cover images through our own origin so they can be drawn onto a
// <canvas> and exported without tainting it with cross-origin pixel data.
const ALLOWED_HOSTS = [
  'covers.openlibrary.org',
  'books.google.com',
  'books.googleusercontent.com',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
    : null;

  const hostAllowed =
    parsed.protocol === 'https:' &&
    (ALLOWED_HOSTS.includes(parsed.host) || parsed.host === supabaseHost);

  if (!hostAllowed) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 });
  }

  const res = await fetch(parsed.toString());
  if (!res.ok || !res.body) {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
  }

  return new NextResponse(res.body, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
