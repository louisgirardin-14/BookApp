'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
  }

  redirect(next || '/');
}

function siteOrigin() {
  const host = headers().get('host')!;
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

// One-time bootstrap: invites the owner account (OWNER_EMAIL) so the very
// first login can happen with no accounts existing yet. No-ops once any
// account exists, so it can't be replayed to spam invites.
export async function bootstrapOwnerInvite() {
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    throw new Error('Setup has already been completed -- log in normally.');
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) throw new Error('OWNER_EMAIL is not configured on the server.');

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(ownerEmail, {
    redirectTo: `${siteOrigin()}/auth/set-password`,
  });
  if (error) throw new Error(error.message);
}
