import { useEffect, useState } from 'react';
import { resolveLoadoutBake, type SpriteArt } from '../engine/art';
import type { Profile } from '../state/types';

// Resolves the approved loadout bake for a player (spec section 15 contract):
// query avatar_renders → generated_images, fall back to null (the SVG
// placeholder) when no approved bake exists. Returns null until the Phase 8
// generation pass populates the art tables.
export function useAvatarSprite(profile: Profile, tier: number): SpriteArt | null {
  const [art, setArt] = useState<SpriteArt | null>(null);
  const loadoutKey = JSON.stringify(profile.equipped ?? {});

  useEffect(() => {
    let active = true;
    resolveLoadoutBake(profile.user_id, tier, profile.equipped ?? {})
      .then((a) => { if (active) setArt(a); })
      .catch(() => { if (active) setArt(null); });
    return () => { active = false; };
  }, [profile.user_id, tier, loadoutKey, profile.equipped]);

  return art;
}
