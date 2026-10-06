import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ENABLED, supabasePublishableKey, supabaseUrl } from './env';

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;
  const url = supabaseUrl() ?? 'http://localhost';
  const key = supabasePublishableKey() ?? 'anon';
  client = createBrowserClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
