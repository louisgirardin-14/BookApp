'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

function siteOrigin() {
  const host = headers().get('host')!;
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

// Owner-only: invite-only signup means new accounts can only be created
// this way, by the account whose email matches OWNER_EMAIL.
export async function inviteFriend(email: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.OWNER_EMAIL) {
    throw new Error('Only the owner can invite people.');
  }

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteOrigin()}/auth/set-password`,
  });
  if (error) throw new Error(error.message);
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// GDPR right-to-erasure: deletes this account's photos from storage, then
// deletes the auth user, which cascades (via FK) to their profile and
// every book they own.
export async function deleteAccount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');

  const { data: books } = await supabase
    .from('books')
    .select('cover_url, spine_url')
    .eq('user_id', user.id);

  const bucketMarker = '/storage/v1/object/public/covers/';
  const paths = (books ?? [])
    .flatMap((b) => [b.cover_url, b.spine_url])
    .filter((url): url is string => !!url && url.includes(bucketMarker))
    .map((url) => url.split(bucketMarker)[1]);

  if (paths.length > 0) {
    await supabaseAdmin.storage.from('covers').remove(paths);
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);
}
