// `gen cosmetic <slug> [--player linus]`
// Generates the standalone grid item for any cosmetic. For 'special' (full-avatar
// reskin) slugs, also generates a full replacement sheet for the given player.

import { CONFIG } from '../lib/env.ts';
import { getCosmeticPrompt } from '../prompts/cosmetics.ts';
import { getPlayer } from '../prompts/players.ts';
import { cosmeticStandalonePrompt, specialPrompt } from '../lib/prompt.ts';
import { recordPromptVersion, recordImage } from '../lib/versioning.ts';
import { nextVersion, upload } from '../lib/storage.ts';
import { genAndCut, produceSheet } from '../lib/pipeline.ts';
import { iconFrame } from '../lib/sheet.ts';
import { log } from '../lib/log.ts';

export async function cosmeticCmd(positional: string[], flags: Record<string, string | boolean>): Promise<void> {
  const [slug] = positional;
  if (!slug) throw new Error('Usage: gen cosmetic <slug> [--player linus]');
  const cp = getCosmeticPrompt(slug);
  log.step(`cosmetic ${slug} (${cp.slot} / ${cp.strategy})`);

  // Standalone grid icon — every cosmetic gets one.
  const iconPrompt = cosmeticStandalonePrompt(slug);
  const pv = await recordPromptVersion({
    kind: 'cosmetic', target: `cosmetic:${slug}`, resolvedPrompt: iconPrompt, model: CONFIG.geminiModel(),
    params: { slug, slot: cp.slot, strategy: cp.strategy },
  });
  const prefix = `cosmetics/${slug}`;
  const v = await nextVersion(prefix);
  const vdir = `${prefix}/v${v}`;

  log.info('generating standalone item…');
  const { raw, cut } = await genAndCut(iconPrompt);
  await upload(`${vdir}/raw.png`, raw, 'image/png');
  await recordImage({ promptVersionId: pv.id, variant: 'raw', storagePath: `${vdir}/raw.png` });
  const icon = await iconFrame(cut);
  await upload(`${vdir}/standalone.png`, icon, 'image/png');
  const iconId = await recordImage({ promptVersionId: pv.id, variant: 'standalone', storagePath: `${vdir}/standalone.png` });
  log.ok(`standalone → ${vdir}/standalone.png`);
  log.info(`approve the icon:  npm run gen -- approve ${iconId}`);

  // Special slot → full-avatar replacement sheet (per player).
  if (cp.strategy === 'special') {
    const playerSlug = flags.player as string | undefined;
    if (!playerSlug) {
      log.warn(`"${slug}" is a special (full-avatar) cosmetic — pass --player <slug> to also generate the replacement sheet.`);
      return;
    }
    const player = getPlayer(playerSlug);
    const sp = specialPrompt(slug, player.slug);
    const spv = await recordPromptVersion({
      kind: 'cosmetic', target: `cosmetic:${slug}:${player.slug}`, resolvedPrompt: sp, model: CONFIG.geminiModel(),
      params: { slug, player: player.slug, strategy: 'special' },
    });
    const sprefix = `cosmetics/${slug}/${player.slug}`;
    const sv = await nextVersion(sprefix);
    const svdir = `${sprefix}/v${sv}`;
    log.info('generating special replacement frame 0…');
    const { raw: sraw, cut: scut } = await genAndCut(sp);
    await upload(`${svdir}/raw/idle_0.png`, sraw, 'image/png');
    await recordImage({ promptVersionId: spv.id, variant: 'raw', clip: 'idle', frameIndex: 0, storagePath: `${svdir}/raw/idle_0.png` });
    await upload(`${svdir}/cut/idle_0.png`, scut, 'image/png');
    await recordImage({ promptVersionId: spv.id, variant: 'cutout', clip: 'idle', frameIndex: 0, storagePath: `${svdir}/cut/idle_0.png` });
    const { sheetImageId } = await produceSheet({
      promptVersionId: spv.id, vdir: svdir, frame0Raw: sraw, frame0Cut: scut, clips: ['idle', 'flex'], tier: 6,
    });
    log.ok(`special sheet → ${svdir}/sheet.png`);
    log.info(`approve the special:  npm run gen -- approve ${sheetImageId}`);
  }
}
