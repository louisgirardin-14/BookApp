import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Read-only client (RLS only grants SELECT to anon). Safe to use in
// server components and client components alike.
export const supabase = createClient(url, anonKey);
