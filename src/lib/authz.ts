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
