// Prompt composition (§6). Resolves the editable fragment layers into the exact
// string sent to the model. The composed string is what gets snapshotted into
// prompt_versions — so this is the single place "how a prompt is assembled" lives.

import { BASE_STYLE, ITEM_FRAMING, sideClause } from '../prompts/base-style.ts';
import { getPlayer } from '../prompts/players.ts';
import { getTier } from '../prompts/avatars.ts';
import { getCosmeticPrompt } from '../prompts/cosmetics.ts';
import { vortexPrompt, type VortexStage } from '../prompts/effects.ts';

/** Avatar base pose (frame 0) = base-style + identity + tier physique + side. */
export function avatarBasePrompt(playerSlug: string, tier: number): string {
  const player = getPlayer(playerSlug);
  const t = getTier(tier);
  return [
    BASE_STYLE,
    `CHARACTER IDENTITY: ${player.identity}`,
    t.physique,
    sideClause(player.side),
    'One single static frame, the neutral resting pose. Do NOT draw multiple poses or a strip.',
  ].join('\n\n');
}

/** Animation frame = image-to-image edit on frame 0 + this frame's motion. */
export function framePrompt(motion: string): string {
  return [
    'Edit this exact character: keep identity, physique, clothing, palette, flat-block pixel style,',
    'framing, scale, and upper-left lighting IDENTICAL. Same single character on the same flat background.',
    `Change ONLY the pose — now: ${motion}.`,
    'One single frame. Do NOT draw a strip or multiple poses.',
  ].join(' ');
}

/** Standalone cosmetic grid item. */
export function cosmeticStandalonePrompt(slug: string): string {
  const cp = getCosmeticPrompt(slug);
  return [BASE_STYLE, `ITEM: ${cp.fragment}.`, ITEM_FRAMING].join('\n\n');
}

/** Special full-avatar replacement (its own base pose). */
export function specialPrompt(slug: string, playerSlug: string): string {
  const cp = getCosmeticPrompt(slug);
  const player = getPlayer(playerSlug);
  return [
    BASE_STYLE,
    `CHARACTER IDENTITY (kept recognisable): ${player.identity}`,
    `REPLACEMENT: ${cp.fragment}.`,
    sideClause(player.side),
    'One single static frame, neutral resting pose. Do NOT draw a strip.',
  ].join('\n\n');
}

/** Loadout bake = image-to-image on the current avatar + worn fragments. */
export function bakePrompt(fragments: string[]): string {
  return [
    'Edit this exact character: keep identity, physique, pose, framing, scale, palette, flat-block',
    'pixel style and upper-left lighting IDENTICAL. Same single character on the same flat background.',
    `Now dress the character — add ONLY: ${fragments.join('; ')}.`,
    'Fit the items naturally to the body. One single frame. Do NOT draw a strip.',
  ].join(' ');
}

export function effectPrompt(stage: VortexStage): string {
  return [BASE_STYLE, `EFFECT: ${vortexPrompt(stage)}`].join('\n\n');
}
