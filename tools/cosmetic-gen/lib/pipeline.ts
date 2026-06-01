// Shared generation flow used by avatar/bake/special commands. The consistency
// technique (§6): frame 0 first, then every other frame as an image-to-image edit
// conditioned on frame 0 so the character can't drift. Each raw + cutout frame and
// the packed sheet are archived; nothing is overwritten.

import { generateImage } from './gemini.ts';
import { cutout } from './bg.ts';
import { packSheet, type PackClip, type AtlasMeta } from './sheet.ts';
import { upload } from './storage.ts';
import { recordImage } from './versioning.ts';
import { framePrompt } from './prompt.ts';
import { clipFrames, CLIP_FPS, type ClipName } from '../prompts/clips.ts';
import { log } from './log.ts';

export async function genAndCut(prompt: string, inputImages?: Buffer[]): Promise<{ raw: Buffer; cut: Buffer }> {
  const raw = await generateImage(prompt, { inputImages });
  const cut = await cutout(raw);
  return { raw, cut };
}

async function archiveFrame(
  promptVersionId: string, vdir: string, clip: string, i: number, raw: Buffer | null, cut: Buffer,
): Promise<void> {
  if (raw) {
    const rawPath = `${vdir}/raw/${clip}_${i}.png`;
    await upload(rawPath, raw, 'image/png');
    await recordImage({ promptVersionId, variant: 'raw', clip, frameIndex: i, storagePath: rawPath });
  }
  const cutPath = `${vdir}/cut/${clip}_${i}.png`;
  await upload(cutPath, cut, 'image/png');
  await recordImage({ promptVersionId, variant: 'cutout', clip, frameIndex: i, storagePath: cutPath });
}

export interface ProduceSheetArgs {
  promptVersionId: string;
  vdir: string;
  frame0Raw: Buffer;
  frame0Cut: Buffer;
  clips: ClipName[];
  tier: number;
  maxFrames?: number;
}

/** Generate every clip's frames (image-to-image off frame 0), archive them, pack a
 *  multi-row sheet, upload it + atlas JSON, and return the spritesheet image id.
 *  Assumes the caller already archived frame 0 (idle_0). */
export async function produceSheet(a: ProduceSheetArgs): Promise<{ sheetImageId: string; atlas: AtlasMeta; sheetPath: string }> {
  const packClips: PackClip[] = [];

  for (const clip of a.clips) {
    const motions = clipFrames(clip, a.tier).slice(0, a.maxFrames ?? undefined);
    const frames: Buffer[] = [];
    for (let i = 0; i < motions.length; i++) {
      if (clip === 'idle' && i === 0) {
        frames.push(a.frame0Cut); // already archived by caller
        continue;
      }
      log.dim(`  ${clip} frame ${i}: ${motions[i]}`);
      const { raw, cut } = await genAndCut(framePrompt(motions[i]), [a.frame0Raw]);
      await archiveFrame(a.promptVersionId, a.vdir, clip, i, raw, cut);
      frames.push(cut);
    }
    packClips.push({ name: clip, fps: CLIP_FPS[clip], frames });
  }

  const { sheet, atlas } = await packSheet(packClips);
  const sheetPath = `${a.vdir}/sheet.png`;
  await upload(sheetPath, sheet, 'image/png');
  await upload(`${a.vdir}/sheet.json`, Buffer.from(JSON.stringify(atlas, null, 2)), 'application/json');
  const sheetImageId = await recordImage({
    promptVersionId: a.promptVersionId,
    variant: 'spritesheet',
    storagePath: sheetPath,
    width: atlas.frameWidth,
    height: atlas.frameHeight,
    atlas,
  });
  return { sheetImageId, atlas, sheetPath };
}

export { archiveFrame };
