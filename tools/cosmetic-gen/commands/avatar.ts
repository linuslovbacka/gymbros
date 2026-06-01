// `gen avatar <player> <tier> [--clip idle,flex] [--frames N]`
// Generate/version a player's base avatar at a tier, then clip frames + sheet.

import { CONFIG } from '../lib/env.ts';
import { getPlayer } from '../prompts/players.ts';
import { getTier } from '../prompts/avatars.ts';
import { avatarBasePrompt } from '../lib/prompt.ts';
import { recordPromptVersion, recordImage } from '../lib/versioning.ts';
import { nextVersion, upload } from '../lib/storage.ts';
import { genAndCut, produceSheet } from '../lib/pipeline.ts';
import type { ClipName } from '../prompts/clips.ts';
import { log } from '../lib/log.ts';

export async function avatarCmd(positional: string[], flags: Record<string, string | boolean>): Promise<void> {
  const [playerSlug, tierStr] = positional;
  if (!playerSlug || !tierStr) throw new Error('Usage: gen avatar <player> <tier> [--clip idle,flex] [--frames N]');
  const player = getPlayer(playerSlug);
  const tier = getTier(Number(tierStr)).tier;
  const clips = ((flags.clip as string) ?? 'idle,flex').split(',').map((c) => c.trim()) as ClipName[];
  const maxFrames = flags.frames ? Number(flags.frames) : undefined;

  const resolved = avatarBasePrompt(player.slug, tier);
  const target = `avatar:${player.slug}:tier${tier}`;
  log.step(`avatar ${player.slug} tier ${tier} — clips [${clips.join(', ')}]${maxFrames ? `, ${maxFrames} frames` : ''}`);

  const pv = await recordPromptVersion({
    kind: 'avatar', target, resolvedPrompt: resolved, model: CONFIG.geminiModel(),
    params: { player: player.slug, tier, side: player.side, clips, maxFrames },
  });
  log.dim(`prompt_version ${pv.id} v${pv.version}`);

  const prefix = `${player.slug}/tier${tier}`;
  const v = await nextVersion(prefix);
  const vdir = `${prefix}/v${v}`;

  log.info('generating frame 0…');
  const { raw, cut } = await genAndCut(resolved);
  await upload(`${vdir}/raw/idle_0.png`, raw, 'image/png');
  await recordImage({ promptVersionId: pv.id, variant: 'raw', clip: 'idle', frameIndex: 0, storagePath: `${vdir}/raw/idle_0.png` });
  await upload(`${vdir}/cut/idle_0.png`, cut, 'image/png');
  await recordImage({ promptVersionId: pv.id, variant: 'cutout', clip: 'idle', frameIndex: 0, storagePath: `${vdir}/cut/idle_0.png` });

  const { sheetImageId, sheetPath } = await produceSheet({
    promptVersionId: pv.id, vdir, frame0Raw: raw, frame0Cut: cut, clips, tier, maxFrames,
  });

  log.ok(`sheet → ${sheetPath}`);
  log.info(`review it, then:  npm run gen -- approve ${sheetImageId} --player ${player.slug}`);
}
