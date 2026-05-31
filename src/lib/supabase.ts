import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const SUPABASE_ENABLED = Boolean(url && key);

if (!SUPABASE_ENABLED) {
  // The app still renders so you can see the UI before keys are wired in.
  console.warn('[gymbros] Supabase env vars missing — running in offline shell mode.');
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'anon', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
