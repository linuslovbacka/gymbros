// `gen approve <imageId> [--player slug] [--profile uuid]`
// Promotes an image to the live asset (is_approved = true) and wires the pointer
// the app resolves: cosmetics.current_image_id for cosmetics, avatar_renders for
// avatar/bake sheets. Rollback = approve an older image id — nothing is deleted.

import { getImage, getPromptVersion, setApproved } from '../lib/versioning.ts';
import { getCosmeticPrompt } from '../prompts/cosmetics.ts';
import { EMPTY_LOADOUT_HASH } from '../lib/loadout.ts';
import { resolveProfileId } from '../lib/profiles.ts';
import { admin } from '../lib/supabase.ts';
import { log } from '../lib/log.ts';

async function pointCosmetic(slug: string, imageId: string): Promise<void> {
  const { data: upd, error } = await admin
    .from('cosmetics').update({ current_image_id: imageId }).eq('slug', slug).select('id');
  if (error) throw new Error(error.message);
  if (!upd || upd.length === 0) {
    const { error: insErr } = await admin.from('cosmetics').insert({
      slug, name: slug, slot: getCosmeticPrompt(slug).slot, current_image_id: imageId,
    });
    if (insErr) throw new Error(insErr.message);
  }
  log.ok(`cosmetics.current_image_id set for "${slug}"`);
}

async function pointAvatarRender(profileId: string, tier: number, hash: string, imageId: string): Promise<void> {
  const { data: existing } = await admin
    .from('avatar_renders').select('id')
    .eq('profile_id', profileId).eq('tier', tier).eq('loadout_hash', hash).maybeSingle();
  if (existing?.id) {
    const { error } = await admin.from('avatar_renders').update({ spritesheet_image_id: imageId }).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin.from('avatar_renders').insert({
      profile_id: profileId, tier, loadout_hash: hash, spritesheet_image_id: imageId,
    });
    if (error) throw new Error(error.message);
  }
  log.ok(`avatar_renders → profile ${profileId.slice(0, 8)}… tier ${tier} [${hash}]`);
}

export async function approveCmd(positional: string[], flags: Record<string, string | boolean>): Promise<void> {
  const imageId = positional[0];
  if (!imageId) throw new Error('Usage: gen approve <imageId> [--player slug] [--profile uuid]');

  const img = await getImage(imageId);
  if (!img) throw new Error(`No generated_image ${imageId}`);
  const pv = await getPromptVersion(img.prompt_version_id as string);
  if (!pv) throw new Error(`Image ${imageId} has no prompt_version.`);

  await setApproved(imageId, true);
  log.step(`approved image ${imageId} (${pv.kind} ${pv.target})`);

  const parts = (pv.target as string).split(':');
  if (pv.kind === 'cosmetic') {
    await pointCosmetic(parts[1], imageId);
    return;
  }
  if (pv.kind === 'avatar' || pv.kind === 'bake') {
    const playerSlug = (flags.player as string) ?? parts[1];
    const tier = Number((parts[2] ?? '').replace('tier', ''));
    const hash = pv.kind === 'bake' ? (parts[3] ?? EMPTY_LOADOUT_HASH) : EMPTY_LOADOUT_HASH;
    const profileId = await resolveProfileId(playerSlug, flags.profile as string | undefined);
    if (!profileId) {
      log.warn(`Approved, but couldn't resolve a profile for "${playerSlug}". The avatar_renders pointer was NOT written.`);
      log.info(`Re-run with --profile <uuid>, or set ${playerSlug.toUpperCase()}_PROFILE_ID in .env.local.`);
      return;
    }
    await pointAvatarRender(profileId, tier, hash, imageId);
    return;
  }
  // effect: flag is enough for now (vortex resolved by stage lookup later).
  log.ok('effect image approved.');
}
