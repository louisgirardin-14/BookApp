import 'server-only';
import { supabaseAdmin } from './supabaseAdmin';

export type Role = 'owner' | 'admin' | 'member';

// Looks up the account's role directly (bypassing RLS, server-only) so
// admin rights live in the database instead of a single OWNER_EMAIL
// string compared in every action -- lets more than one person hold
// admin rights without redeploying env vars.
export async function getRole(userId: string): Promise<Role> {
  const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).single();
  return (data?.role as Role | undefined) ?? 'member';
}

export function canManageAccounts(role: Role): boolean {
  return role === 'owner' || role === 'admin';
}

// Set to 'true' once the app is ready for open public sign-up. Until then,
// Google/Apple sign-in still requires the email to already be on the
// invite allowlist -- same invite-only model as the password flow, just
// with a nicer login button.
export function openSignupEnabled(): boolean {
  return process.env.OPEN_SIGNUP === 'true';
}

export async function isInvited(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('invited_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  return !!data;
}

export async function addToInviteAllowlist(email: string, invitedBy: string) {
  await supabaseAdmin.from('invited_emails').upsert({ email, invited_by: invitedBy });
}
