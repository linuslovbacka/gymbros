// Frame alignment + spritesheet packing via sharp (§3/§6). The MODEL never lays
// out the strip — this packs it deterministically: clips become ROWS, frames run
// left→right within a row. That layout matches the app's SpriteAnimator, which
// reads backgroundPosition = (-frame*frameWidth, -row*frameHeight).

import sharp from 'sharp';
import { FRAME_W, FRAME_H } from '../prompts/base-style.ts';

/** Atlas shape consumed verbatim by the app (src/components/SpriteAnimator.tsx). */
export interface AtlasClip { row: number; frames: number; fps: number }
export interface AtlasMeta {
  frameWidth: number;
  frameHeight: number;
  clips: Record<string, AtlasClip>;
}

export interface PackClip {
  name: string;
  fps: number;
  /** Transparent cutout PNGs, in playback order. */
  frames: Buffer[];
}

/** Resize a transparent cutout into the canonical frame box, nearest-neighbour
 *  (crisp pixels), anchored to the feet (bottom-centre). */
export async function normalizeFrame(png: Buffer, w = FRAME_W, h = FRAME_H): Promise<Buffer> {
  return sharp(png)
    .resize({
      width: w,
      height: h,
      fit: 'contain',
      position: 'south',
      kernel: 'nearest',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Pack clips into a single multi-row sheet + atlas. */
export async function packSheet(
  clips: PackClip[],
  w = FRAME_W,
  h = FRAME_H,
): Promise<{ sheet: Buffer; atlas: AtlasMeta }> {
  const cols = Math.max(1, ...clips.map((c) => c.frames.length));
  const rows = clips.length;

  const composites: sharp.OverlayOptions[] = [];
  const atlasClips: Record<string, AtlasClip> = {};

  for (let r = 0; r < clips.length; r++) {
    const clip = clips[r];
    atlasClips[clip.name] = { row: r, frames: clip.frames.length, fps: clip.fps };
    for (let f = 0; f < clip.frames.length; f++) {
      const frame = await normalizeFrame(clip.frames[f], w, h);
      composites.push({ input: frame, left: f * w, top: r * h });
    }
  }

  const sheet = await sharp({
    create: { width: cols * w, height: rows * h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return { sheet, atlas: { frameWidth: w, frameHeight: h, clips: atlasClips } };
}

/** Single standalone item: just normalise to a square-ish icon box, keep transparency. */
export async function iconFrame(png: Buffer, size = FRAME_H): Promise<Buffer> {
  return sharp(png)
    .resize({ width: size, height: size, fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}
