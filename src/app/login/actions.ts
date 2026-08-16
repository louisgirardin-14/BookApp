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

// Returns a direct access link for OWNER_EMAIL instead of relying on
// email delivery (which can be slow, filtered, or rate-limited on
// Supabase's shared sending domain). Only works before the owner's very
// first successful sign-in -- this page is public, so once the real
// owner has logged in even once, this must stop producing a usable link
// for anyone who finds the button, or it would be an account takeover.
export async function bootstrapOwnerAccess(): Promise<string> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) throw new Error('OWNER_EMAIL is not configured on the server.');

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw new Error(listError.message);
  const existing = list.users.find((u) => u.email === ownerEmail);

  if (existing?.last_sign_in_at) {
    throw new Error('This account is already set up -- log in with your password instead.');
  }

  const redirectTo = `${siteOrigin()}/auth/set-password`;

  if (!existing) {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: ownerEmail,
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
    return data.properties.action_link;
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: ownerEmail,
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
  return data.properties.action_link;
}
