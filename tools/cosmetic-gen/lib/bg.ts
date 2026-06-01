// Local background removal via @imgly/background-removal-node (§2). No paid API,
// no per-image cost. If pixel-art cutouts look soft, swap to remove.bg here — the
// rest of the pipeline only cares that this returns a transparent PNG buffer.

import { removeBackground } from '@imgly/background-removal-node';

export async function cutout(png: Buffer): Promise<Buffer> {
  const blob = new Blob([new Uint8Array(png)], { type: 'image/png' });
  const result = await removeBackground(blob);
  const arr = await result.arrayBuffer();
  return Buffer.from(arr);
}
