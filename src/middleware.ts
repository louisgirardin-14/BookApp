import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { response, user } = await updateSession(req);

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (isPublicRoute) {
    return response;
  }

  if (!user) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
