'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE } from '@/lib/auth';

export async function login(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');
  const expected = process.env.APP_PASSWORD;

  if (!expected || password !== expected) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=1`);
  }

  cookies().set(AUTH_COOKIE, expected, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(next || '/');
}
