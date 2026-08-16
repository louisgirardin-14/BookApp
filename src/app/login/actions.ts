'use server';

import { redirect } from 'next/navigation';
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

// Sets OWNER_EMAIL's password directly via the Admin API -- no magic
// link, no redirect URL, no session-establishment dance. Only works
// before the owner's very first successful sign-in (this page is
// public, so once the real owner has actually logged in, this must
// stop working for anyone who finds it, or it's an account takeover).
export async function claimOwnerAccount(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  const next = String(formData.get('next') ?? '/');
  const claimError = (message: string) =>
    redirect(`/login?claim=1&next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);

  if (password.length < 8) return claimError('Password must be at least 8 characters.');
  if (password !== confirm) return claimError('Passwords do not match.');

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) return claimError('OWNER_EMAIL is not configured on the server.');

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) return claimError(listError.message);

  const existing = list.users.find((u) => u.email === ownerEmail);

  if (existing?.last_sign_in_at) {
    redirect(`/login?error=${encodeURIComponent('This account is already set up -- sign in above.')}`);
  }

  if (!existing) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
    });
    if (error) return claimError(error.message);
  } else {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
    if (error) return claimError(error.message);
  }

  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password,
  });
  if (signInError) return claimError(signInError.message);

  redirect(next || '/');
}
