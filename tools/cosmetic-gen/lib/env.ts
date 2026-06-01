// Loads local secrets from tools/cosmetic-gen/.env.local. These NEVER ship to the
// client — the app uses only the publishable anon key. Falls back to the app's
// VITE_SUPABASE_URL if SUPABASE_URL isn't set, so you only have to add the two
// secret values (service-role key + Gemini key).

import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
loadDotenv({ path: resolve(root, '.env.local') });
// Also pull the app env (one dir up x2) so VITE_SUPABASE_URL can be reused.
loadDotenv({ path: resolve(root, '..', '..', '.env.local') });

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) {
    throw new Error(
      `Missing env var ${name}. Copy tools/cosmetic-gen/.env.local.example to .env.local and fill it in.`,
    );
  }
  return v;
}

export const CONFIG = {
  geminiApiKey: () => req('GEMINI_API_KEY'),
  geminiModel: () => process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3-pro-image-preview',
  supabaseUrl: () => req('SUPABASE_URL', process.env.VITE_SUPABASE_URL),
  supabaseServiceKey: () => req('SUPABASE_SERVICE_ROLE_KEY'),
  avatarsBucket: () => process.env.SUPABASE_AVATARS_BUCKET ?? 'avatars',
};
