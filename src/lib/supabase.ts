import { createClient } from './supabase/client';
import { SUPABASE_ENABLED } from './supabase/env';

if (!SUPABASE_ENABLED && typeof window !== 'undefined') {
  console.warn('[gymbros] Supabase env vars missing — running in offline shell mode.');
}

export { SUPABASE_ENABLED };
export const supabase = createClient();
