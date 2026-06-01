// Resolves a player slug → Supabase profile (user_id) so the pipeline can write
// avatar_renders rows the app reads by profile_id. Resolution order:
//   1. explicit --profile <uuid>
//   2. env LINUS_PROFILE_ID / OSKAR_PROFILE_ID
//   3. profiles row whose lowercased display_name matches the slug
// Returns null if unresolved (the image is still archived + approvable; only the
// avatar_renders pointer is skipped, which you can add later).

import { admin } from './supabase.ts';

export async function resolveProfileId(playerSlug: string, override?: string): Promise<string | null> {
  if (override) return override;

  const envKey = `${playerSlug.toUpperCase()}_PROFILE_ID`;
  if (process.env[envKey]) return process.env[envKey]!;

  const { data } = await admin
    .from('profiles')
    .select('user_id, display_name')
    .ilike('display_name', playerSlug)
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}
