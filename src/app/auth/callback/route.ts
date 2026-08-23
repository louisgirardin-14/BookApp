import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isInvited, openSignupEnabled } from '@/lib/authz';

// Handles the redirect back from Google/Apple after signInWithOAuth().
// Exchanges the auth code for a session, then enforces the same
// invite-only model as the existing password flow: unless open sign-up
// is turned on, the email must already be on the invite allowlist, or the
// brand-new auth user Supabase just created gets deleted again and the
// visitor is sent back to /login with an explanation.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  const deny = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);

  if (!code) return deny('Sign-in failed. Please try again.');

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return deny(error?.message ?? 'Sign-in failed. Please try again.');

  const email = data.user.email;
  if (!openSignupEnabled() && (!email || !(await isInvited(email)))) {
    // Supabase already created the auth user on first OAuth login --
    // clean it up rather than leaving an orphaned, allowlist-less account.
    await supabase.auth.signOut();
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    return deny('This app is invite-only. Ask the owner for access.');
  }

  return NextResponse.redirect(`${origin}${next}`);
}
