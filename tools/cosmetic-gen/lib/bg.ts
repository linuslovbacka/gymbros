// Background removal. Because we control the generation background (a known flat
// magenta, §5), a deterministic CHROMA KEY is crisper than ML segmentation for this
// flat-block pixel art — it cuts exactly the key colour and despills the pink fringe
// on anti-aliased edges, with no haloing. (@imgly stays available as a fallback for
// art generated on non-keyed backgrounds.)

import sharp from 'sharp';
import { GEN_BACKGROUND } from '../prompts/base-style.ts';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Remove a flat key-colour background and despill its tint from edge pixels. */
export async function cutout(png: Buffer, keyHex: string = GEN_BACKGROUND): Promise<Buffer> {
  const [kr, kg, kb] = hexToRgb(keyHex);
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Distance below which a pixel is considered background (fully transparent),
  // and a feather band above it for soft edges.
  const HARD = 90;
  const FEATHER = 150;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const d = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);

    if (d <= HARD) {
      data[i + 3] = 0;
    } else if (d < FEATHER) {
      data[i + 3] = Math.round(((d - HARD) / (FEATHER - HARD)) * data[i + 3]);
    }

    // Despill: magenta key bleeds pink into kept edge pixels (r,b high vs g).
    if (data[i + 3] > 0 && r > g && b > g) {
      data[i] = Math.round(g + (r - g) * 0.35);
      data[i + 2] = Math.round(g + (b - g) * 0.35);
    }
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}
