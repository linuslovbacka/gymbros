// `gen vortex <stage 1..5> [--frames N]`
// Generate/version a fire-vortex stage loop. Neutral/white, currency-agnostic —
// the app tints it (orange GRIT / cold blue IRON) at runtime.

import { CONFIG } from '../lib/env.ts';
import { effectPrompt } from '../lib/prompt.ts';
import { VORTEX_FRAMES, VORTEX_FPS, VORTEX_STAGES, type VortexStage } from '../prompts/effects.ts';
import { framePrompt } from '../lib/prompt.ts';
import { recordPromptVersion, recordImage } from '../lib/versioning.ts';
import { nextVersion, upload } from '../lib/storage.ts';
import { genAndCut } from '../lib/pipeline.ts';
import { cutout } from '../lib/bg.ts';
import { generateImage } from '../lib/gemini.ts';
import { packSheet } from '../lib/sheet.ts';
import { log } from '../lib/log.ts';

export async function vortexCmd(positional: string[], flags: Record<string, string | boolean>): Promise<void> {
  const stage = Number(positional[0]) as VortexStage;
  if (!VORTEX_STAGES.includes(stage)) throw new Error(`Usage: gen vortex <stage>  (stage in ${VORTEX_STAGES.join('|')})`);
  const frameCount = flags.frames ? Number(flags.frames) : VORTEX_FRAMES;

  const resolved = effectPrompt(stage);
  const target = `effect:vortex:stage${stage}`;
  log.step(`vortex stage ${stage} — ${frameCount} frame loop`);

  const pv = await recordPromptVersion({
    kind: 'effect', target, resolvedPrompt: resolved, model: CONFIG.geminiModel(), params: { stage, frames: frameCount },
  });
  const prefix = `effects/vortex/stage${stage}`;
  const v = await nextVersion(prefix);
  const vdir = `${prefix}/v${v}`;

  log.info('generating frame 0…');
  const { raw: raw0, cut: cut0 } = await genAndCut(resolved);
  await upload(`${vdir}/raw/idle_0.png`, raw0, 'image/png');
  await recordImage({ promptVersionId: pv.id, variant: 'raw', clip: 'idle', frameIndex: 0, storagePath: `${vdir}/raw/idle_0.png` });
  await upload(`${vdir}/cut/idle_0.png`, cut0, 'image/png');
  await recordImage({ promptVersionId: pv.id, variant: 'cutout', clip: 'idle', frameIndex: 0, storagePath: `${vdir}/cut/idle_0.png` });

  const frames: Buffer[] = [cut0];
  for (let i = 1; i < frameCount; i++) {
    log.dim(`  loop frame ${i}`);
    const raw = await generateImage(
      framePrompt('the flames swirl and rise slightly to the next frame of the looping fire, same intensity and shape'),
      { inputImages: [raw0] },
    );
    const cut = await cutout(raw);
    await upload(`${vdir}/cut/idle_${i}.png`, cut, 'image/png');
    await recordImage({ promptVersionId: pv.id, variant: 'cutout', clip: 'idle', frameIndex: i, storagePath: `${vdir}/cut/idle_${i}.png` });
    frames.push(cut);
  }

  const { sheet, atlas } = await packSheet([{ name: 'idle', fps: VORTEX_FPS, frames }]);
  await upload(`${vdir}/sheet.png`, sheet, 'image/png');
  await upload(`${vdir}/sheet.json`, Buffer.from(JSON.stringify(atlas, null, 2)), 'application/json');
  const sheetId = await recordImage({
    promptVersionId: pv.id, variant: 'effect', storagePath: `${vdir}/sheet.png`,
    width: atlas.frameWidth, height: atlas.frameHeight, atlas,
  });

  log.ok(`vortex sheet → ${vdir}/sheet.png`);
  log.info(`approve it:  npm run gen -- approve ${sheetId}`);
}
