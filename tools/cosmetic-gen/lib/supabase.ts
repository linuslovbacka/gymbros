// Service-role Supabase client for the pipeline ONLY. The service key bypasses
// RLS so the CLI can write prompt_versions / generated_images / avatar_renders /
// cosmetics and upload to the avatars bucket. NEVER import this from app code.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CONFIG } from './env.ts';

// Lazy: don't read secrets / construct the client at import time, so commands like
// `help`, arg validation, and prompt composition work without a filled .env.local.
let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(CONFIG.supabaseUrl(), CONFIG.supabaseServiceKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export const admin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    const value = c[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(c) : value;
  },
});
