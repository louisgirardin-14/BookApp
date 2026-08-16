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

// Sets OWNER_EMAIL's password directly via the Admin API and signs in --
// no magic link, no redirect URL config, no email dependency. Doubles as
// both first-time setup and "forgot password" for the owner account.
export async function resetOwnerPassword(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  const next = String(formData.get('next') ?? '/');
  const resetError = (message: string) =>
    redirect(`/login?claim=1&next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);

  if (password.length < 8) return resetError('Password must be at least 8 characters.');
  if (password !== confirm) return resetError('Passwords do not match.');

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) return resetError('OWNER_EMAIL is not configured on the server.');

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) return resetError(listError.message);

  const existing = list.users.find((u) => u.email === ownerEmail);

  if (!existing) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
    });
    if (error) return resetError(error.message);
  } else {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
    if (error) return resetError(error.message);
  }

  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password,
  });
  if (signInError) return resetError(signInError.message);

  redirect(next || '/');
}
