// Shared style block (generation-spec §5). This is the CONSTANT layer prepended
// to every avatar/cosmetic/effect prompt. Edit here to evolve the whole look;
// each generation run snapshots the resolved string into prompt_versions, so the
// git history of this file + the DB archive together explain every image.

/** Canonical native frame box — locked across all tiers, sides, cosmetics. */
export const FRAME_W = 48;
export const FRAME_H = 72;

/** Background colour used ONLY for generation, chosen to cut cleanly with @imgly.
 *  Magenta contrasts the muted desaturated palette so removal never eats t-shirt
 *  or sneaker tones. The transparent cutout is what ships. */
export const GEN_BACKGROUND = '#FF00FF';

export const BASE_STYLE = `
Low-res AAA-shooter sprite style — reference territory Halo / Gears of War / Dead Space.
Gritty, cinematic, desaturated, grounded. NO cartoon, NO chibi, NO anime exaggeration.

FORMAT (locked): a single full-body character sprite designed to read at a native
${FRAME_W}x${FRAME_H} pixel frame, displayed upscaled 3-4x. Full body visible, loose weighted
stance, slight 3/4 turn. NO anti-aliasing on the silhouette: flat colour blocks, hard chunky
pixel edges, visible individual pixels. NOT smooth, NOT painterly, NOT high-detail illustration.

PROPORTIONS: head-to-body ratio 1:7, realistic-heroic. NOT chibi, NOT stumpy, NOT stocky.

SHADING: maximum 3 values per material (base, shadow, highlight). Flat blocks only — no
gradients, no soft blending. Single light source from the upper-left.

OUTLINE: dark outline ONLY on the outer silhouette and major limb separations. Interior
detail comes from value contrast, NOT internal black lines.

FACE: minimal, not a portrait. No detailed eyes/nose/mouth; flat skin, 1-2 dark pixels for
brow shadow. Reads the same in every frame.

PALETTE: about 12 muted desaturated colours total — browns, khakis, gunmetal grays, the
occasional warm amber. NO neon. Do NOT draw a colour legend or swatches in the image.

BACKGROUND: solid flat ${GEN_BACKGROUND} background, nothing else — no ground shadow, no props,
no text. The character is isolated and centered for clean background removal.
`.trim();

/** Appended to single-item (non-avatar) generations. */
export const ITEM_FRAMING = 'Single item only, isolated and centered on the flat background, no character, no mannequin.';

/** Side-facing instruction. Avatar Right (Linus) faces left; Avatar Left (Oskar)
 *  faces right. Never horizontally flip — regenerate the mirror keeping light upper-left. */
export function sideClause(side: 'left' | 'right'): string {
  // side = the screen side the fighter stands on; they face their opponent (center).
  const facing = side === 'right' ? 'facing to the LEFT (toward screen center)' : 'facing to the RIGHT (toward screen center)';
  return `Character is ${facing}, three-quarter turn. Keep the light source upper-left regardless of facing (do not mirror the lighting).`;
}
