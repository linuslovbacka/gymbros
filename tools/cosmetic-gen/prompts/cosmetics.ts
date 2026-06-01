// Per-cosmetic prompt fragments (generation-spec §6), seeded from the app catalog
// (src/content/cosmetics.ts) and gymbros-achievements.md rewards. The app owns
// name/rarity/acquisition; this layer owns only the ART fragment + render strategy.
//
// renderStrategy mirrors the equip model (§4):
//   - 'bake'    body-worn slot → image-to-image onto the avatar (loadout bake)
//   - 'layer'   aura/companion → standalone runtime overlay sheet
//   - 'special' full-avatar replacement sprite
//   - 'icon'    title / non-rendered slot → grid icon only

export type RenderStrategy = 'bake' | 'layer' | 'special' | 'icon';

export interface CosmeticPrompt {
  slug: string;
  slot: string;
  strategy: RenderStrategy;
  /** Visual description fragment. For 'bake' phrased as a worn item ("wearing ..."). */
  fragment: string;
}

export const COSMETIC_PROMPTS: Record<string, CosmeticPrompt> = {
  starter_tee: { slug: 'starter_tee', slot: 'torso', strategy: 'bake',
    fragment: 'a plain logo-less off-white cotton t-shirt, slightly loose fit' },

  tank_black: { slug: 'tank_black', slot: 'torso', strategy: 'bake',
    fragment: 'a black cutoff tank top with very large armholes exposing the shoulders and lats' },
  joggers_olive: { slug: 'joggers_olive', slot: 'legs', strategy: 'bake',
    fragment: 'tapered olive-green joggers, cuffed at the ankle' },
  lifters_classic: { slug: 'lifters_classic', slot: 'feet', strategy: 'bake',
    fragment: 'flat-soled grey weightlifting shoes, low profile, hard sole' },
  snapback: { slug: 'snapback', slot: 'head', strategy: 'bake',
    fragment: 'a backwards flat-brim snapback cap in gunmetal grey' },
  lever_belt: { slug: 'lever_belt', slot: 'waist', strategy: 'bake',
    fragment: 'a thick brown leather lever lifting belt cinched at the waist' },
  chalk_grip: { slug: 'chalk_grip', slot: 'hands', strategy: 'bake',
    fragment: 'hands dusted with white lifting chalk, light chalk smudges' },
  spotter_drone: { slug: 'spotter_drone', slot: 'companion', strategy: 'layer',
    fragment: 'a small floating spotter drone — a rounded gunmetal quadcopter with one amber sensor eye, hovering' },

  sweat_wristbands: { slug: 'sweat_wristbands', slot: 'hands', strategy: 'bake',
    fragment: 'a pair of terry-cloth sweat wristbands on the forearms, muted khaki' },
  headband: { slug: 'headband', slot: 'head', strategy: 'bake',
    fragment: 'a simple training headband across the forehead, muted amber' },
  consistency_crown: { slug: 'consistency_crown', slot: 'head', strategy: 'bake',
    fragment: 'a small understated metal crown resting on the head, dull bronze, not gaudy' },
  streak_aura: { slug: 'streak_aura', slot: 'aura', strategy: 'layer',
    fragment: 'an animated energy aura outline that traces the silhouette, neutral white-hot (tinted in-app), soft licks of energy' },
  lifer_fit: { slug: 'lifer_fit', slot: 'special', strategy: 'special',
    fragment: 'a hardened veteran lifter — full reskin: weathered tank, chalk, belt, scars of a hundred sessions; same identity, legendary presence' },
  ember_accent: { slug: 'ember_accent', slot: 'aura', strategy: 'layer',
    fragment: 'a sparse trail of drifting embers rising around the lower body, neutral white-orange (tinted in-app)' },
  comeback_kid: { slug: 'comeback_kid', slot: 'title', strategy: 'icon',
    fragment: 'a title banner badge reading the comeback theme — small emblem icon only, no character' },
  pr_machine_tag: { slug: 'pr_machine_tag', slot: 'title', strategy: 'icon',
    fragment: 'a title badge with a stacked-plates emblem, small icon only, no character' },

  iron_crown: { slug: 'iron_crown', slot: 'head', strategy: 'bake',
    fragment: 'an imposing forged iron crown, dark gunmetal with faint warm-amber heat in the seams' },
  molten_plate_vest: { slug: 'molten_plate_vest', slot: 'torso', strategy: 'bake',
    fragment: 'a heavy armored vest made of weight-plate metal, dark iron with faint molten amber cracks' },
  titan_greaves: { slug: 'titan_greaves', slot: 'legs', strategy: 'bake',
    fragment: 'massive armored leg greaves of dark iron plate covering the shins and thighs' },
  soul_takeover: { slug: 'soul_takeover', slot: 'special', strategy: 'special',
    fragment: 'a full-avatar legendary reskin — the lifter consumed by a darker stronger entity, armored iron silhouette, glowing cold-amber eyes; an entirely new dominant character that replaces the avatar' },
};

export function getCosmeticPrompt(slug: string): CosmeticPrompt {
  const c = COSMETIC_PROMPTS[slug];
  if (!c) throw new Error(`No prompt fragment for cosmetic "${slug}". Add it to prompts/cosmetics.ts.`);
  return c;
}
