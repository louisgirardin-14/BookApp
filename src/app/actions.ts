'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { CoverSource } from '@/lib/types';

export interface BookInput {
  title: string;
  author: string;
  isbn: string | null;
  cover_url: string;
  cover_source: CoverSource;
  spine_url: string | null;
  date_read: string;
  rating: number | null;
  notes: string | null;
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in.');
  return { supabase, user };
}

// Soft duplicate check -- same title+author already on this shelf. Not a
// hard block (re-reading a book and logging it again is a legitimate
// thing to do), just something the Add Book page warns about before
// saving so a book doesn't get added twice by accident.
export async function findDuplicateBook(
  title: string,
  author: string
): Promise<{ id: string; date_read: string } | null> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from('books')
    .select('id, date_read')
    .eq('user_id', user.id)
    .ilike('title', title.trim())
    .ilike('author', author.trim())
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function addBook(input: BookInput) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from('books')
    .insert({ ...input, user_id: user.id })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/');
  return data.id as string;
}

export async function updateBook(id: string, input: Partial<BookInput>) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('books').update(input).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath(`/book/${id}`);
}

export async function deleteBook(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

// Accepts a data: URL (from camera capture + crop), uploads it to the
// 'covers' storage bucket, and returns its public URL.
export async function uploadCoverImage(dataUrl: string, filenameHint: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');
  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const ext = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
  const safeHint = filenameHint.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 60);
  const path = `${Date.now()}-${safeHint || 'cover'}.${ext}`;

  const { error } = await supabaseAdmin.storage.from('covers').upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage.from('covers').getPublicUrl(path);
  return data.publicUrl;
}

// Downloads an image from a third-party URL (Open Library, Google Books)
// and re-uploads it to our own 'covers' bucket, returning our own URL.
// This is what makes the book data self-contained: once a cover is saved,
// it no longer depends on those providers' CDNs staying up.
export async function mirrorCoverImage(remoteUrl: string, filenameHint: string): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`Failed to fetch source image (${res.status})`);
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const safeHint = filenameHint.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 60);
  const path = `${Date.now()}-${safeHint || 'cover'}.${ext}`;

  const { error } = await supabaseAdmin.storage.from('covers').upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabaseAdmin.storage.from('covers').getPublicUrl(path);
  return data.publicUrl;
}
