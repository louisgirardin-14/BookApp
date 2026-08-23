'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { canManageAccounts, getRole, type Role } from '@/lib/authz';

export async function updateVisibility(isPublic: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { error } = await supabase.from('profiles').update({ is_public: isPublic }).eq('id', user.id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

function randomPassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

// Owner-only: invite-only signup means new accounts can only be created
// this way, by the account whose email matches OWNER_EMAIL. Creates (or
// resets) the account with a random temporary password set directly via
// the Admin API -- no magic link, no email dependency. The owner relays
// the email + password to their friend directly (text, WhatsApp, etc.);
// the friend can change it after logging in.
export async function inviteFriend(email: string): Promise<{ email: string; password: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !canManageAccounts(await getRole(user.id))) {
    throw new Error('Only an owner or admin can invite people.');
  }

  const trimmedEmail = email.trim();
  const password = randomPassword();

  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw new Error(listError.message);
  const existing = list.users.find((u) => u.email === trimmedEmail);

  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
  }

  return { email: trimmedEmail, password };
}

// Lets any logged-in account change its own password.
export async function changeOwnPassword(newPassword: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// Deletes an account's photos from storage, then deletes the auth user,
// which cascades (via FK) to their profile and every book they own.
async function purgeAccount(userId: string) {
  const { data: books } = await supabaseAdmin
    .from('books')
    .select('cover_url, spine_url')
    .eq('user_id', userId);

  const bucketMarker = '/storage/v1/object/public/covers/';
  const paths = (books ?? [])
    .flatMap((b) => [b.cover_url, b.spine_url])
    .filter((url): url is string => !!url && url.includes(bucketMarker))
    .map((url) => url.split(bucketMarker)[1]);

  if (paths.length > 0) {
    await supabaseAdmin.storage.from('covers').remove(paths);
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

// GDPR right-to-erasure, self-serve.
export async function deleteAccount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  await purgeAccount(user.id);
}

// Owner-only: removes another account entirely (books, photos, login).
export async function removeUserAccount(targetUserId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !canManageAccounts(await getRole(user.id))) {
    throw new Error('Only an owner or admin can remove accounts.');
  }
  if (targetUserId === user.id) {
    throw new Error('Use "Delete my account" for your own account.');
  }

  await purgeAccount(targetUserId);
  revalidatePath('/settings');
}

// Owner-only: grants or revokes admin rights on another account. Only the
// owner role can do this -- admins can manage accounts day-to-day, but
// can't create more admins (avoids an admin quietly escalating peers).
export async function setAccountRole(targetUserId: string, role: Role) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || (await getRole(user.id)) !== 'owner') {
    throw new Error('Only the owner can change account roles.');
  }
  if (targetUserId === user.id) {
    throw new Error("You can't change your own role.");
  }
  if (role === 'owner') {
    throw new Error('Ownership cannot be granted this way.');
  }

  const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', targetUserId);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}
