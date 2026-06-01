// Read-only art resolver (spec section 12/15 contract). The app NEVER calls
// image models; it resolves the CURRENT/APPROVED asset for a loadout via DB
// pointers (avatar_renders → generated_images) and the public `avatars` bucket,
// falling back to the base-tier avatar (here: the SVG placeholder) when no bake
// exists. Until the Phase 8 generation pass writes rows, every lookup returns
// null and callers show the placeholder.

import { supabase, SUPABASE_ENABLED } from '../lib/supabase';
import { BODY_SLOTS, type CosmeticSlot } from '../content/cosmetics';
import type { EquipMap } from '../state/types';
import type { AtlasMeta } from '../components/SpriteAnimator';

export interface SpriteArt {
  imageUrl: string;
  atlas: AtlasMeta | null;
}

/** Stable hash of the body-worn loadout — keys the avatar_renders bake cache. */
export function loadoutHash(equipped: EquipMap): string {
  return BODY_SLOTS.map((s: CosmeticSlot) => equipped[s] ?? '_').join('|');
}

function publicUrl(path: string): string {
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/**
 * Resolve the cached loadout bake for a player at a tier. Returns null when the
 * bake is absent or unapproved — the caller then renders the base-tier avatar.
 */
export async function resolveLoadoutBake(
  profileId: string,
  tier: number,
  equipped: EquipMap,
): Promise<SpriteArt | null> {
  if (!SUPABASE_ENABLED) return null;
  const hash = loadoutHash(equipped);
  const { data: render } = await supabase
    .from('avatar_renders')
    .select('spritesheet_image_id')
    .eq('profile_id', profileId)
    .eq('tier', tier)
    .eq('loadout_hash', hash)
    .maybeSingle();
  const imageId = render?.spritesheet_image_id as string | undefined;
  if (!imageId) return null;

  const { data: img } = await supabase
    .from('generated_images')
    .select('storage_path, atlas, is_approved')
    .eq('id', imageId)
    .maybeSingle();
  if (!img || !img.is_approved || !img.storage_path) return null;

  return { imageUrl: publicUrl(img.storage_path as string), atlas: (img.atlas as AtlasMeta) ?? null };
}
