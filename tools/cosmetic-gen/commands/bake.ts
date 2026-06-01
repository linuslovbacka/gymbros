// `gen bake <player> <tier> --loadout head=...,torso=... [--clip ...] [--frames N] [--base <storagePath>]`
// Image-to-image bake of the worn loadout onto the current avatar, cached by
// loadout-hash so the app resolves it (avatar_renders) after approval.

import { CONFIG } from '../lib/env.ts';
import { getPlayer } from '../prompts/players.ts';
import { getTier } from '../prompts/avatars.ts';
import { bakePrompt } from '../lib/prompt.ts';
import { parseLoadout, loadoutFragments, loadoutHash } from '../lib/loadout.ts';
import { recordPromptVersion, recordImage } from '../lib/versioning.ts';
import { admin } from '../lib/supabase.ts';
import { nextVersion, upload, download } from '../lib/storage.ts';
import { cutout } from '../lib/bg.ts';
import { generateImage } from '../lib/gemini.ts';
import { produceSheet } from '../lib/pipeline.ts';
import type { ClipName } from '../prompts/clips.ts';
import { log } from '../lib/log.ts';

/** Latest archived frame-0 cutout for a player+tier base avatar, to condition on. */
async function latestBaseFrame(player: string, tier: number, override?: string): Promise<Buffer> {
  if (override) return download(override);
  const { data } = await admin
    .from('generated_images')
    .select('storage_path, prompt_versions!inner(kind, target)')
    .eq('prompt_versions.kind', 'avatar')
    .eq('prompt_versions.target', `avatar:${player}:tier${tier}`)
    .eq('variant', 'cutout')
    .eq('clip', 'idle')
    .eq('frame_index', 0)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const path = (data as { storage_path?: string } | null)?.storage_path;
  if (!path) {
    throw new Error(`No base avatar frame for ${player} tier ${tier}. Run "gen avatar ${player} ${tier}" first, or pass --base <storagePath>.`);
  }
  return download(path);
}

export async function bakeCmd(positional: string[], flags: Record<string, string | boolean>): Promise<void> {
  const [playerSlug, tierStr] = positional;
  if (!playerSlug || !tierStr) throw new Error('Usage: gen bake <player> <tier> --loadout slot=slug,...');
  const player = getPlayer(playerSlug);
  const tier = getTier(Number(tierStr)).tier;
  const loadout = parseLoadout(flags.loadout as string | undefined);
  const fragments = loadoutFragments(loadout);
  if (fragments.length === 0) throw new Error('Provide --loadout slot=slug,... with at least one body item.');
  const hash = loadoutHash(loadout);
  const clips = ((flags.clip as string) ?? 'idle,flex').split(',').map((c) => c.trim()) as ClipName[];
  const maxFrames = flags.frames ? Number(flags.frames) : undefined;

  log.step(`bake ${player.slug} tier ${tier} — loadout [${hash}]`);
  const base = await latestBaseFrame(player.slug, tier, flags.base as string | undefined);

  const resolved = bakePrompt(fragments);
  const target = `bake:${player.slug}:tier${tier}:${hash}`;
  const pv = await recordPromptVersion({
    kind: 'bake', target, resolvedPrompt: resolved, model: CONFIG.geminiModel(),
    params: { player: player.slug, tier, loadout, loadout_hash: hash, clips },
  });

  const prefix = `bakes/${player.slug}/tier${tier}/${hash}`;
  const v = await nextVersion(prefix);
  const vdir = `${prefix}/v${v}`;

  log.info('baking loadout onto frame 0 (image-to-image)…');
  const raw = await generateImage(resolved, { inputImages: [base] });
  const cut = await cutout(raw);
  await upload(`${vdir}/raw/idle_0.png`, raw, 'image/png');
  await recordImage({ promptVersionId: pv.id, variant: 'raw', clip: 'idle', frameIndex: 0, storagePath: `${vdir}/raw/idle_0.png` });
  await upload(`${vdir}/cut/idle_0.png`, cut, 'image/png');
  await recordImage({ promptVersionId: pv.id, variant: 'cutout', clip: 'idle', frameIndex: 0, storagePath: `${vdir}/cut/idle_0.png` });

  const { sheetImageId, sheetPath } = await produceSheet({
    promptVersionId: pv.id, vdir, frame0Raw: raw, frame0Cut: cut, clips, tier, maxFrames,
  });

  log.ok(`bake sheet → ${sheetPath}`);
  log.info(`review it, then:  npm run gen -- approve ${sheetImageId} --player ${player.slug}`);
}
