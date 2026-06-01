// Cosmetic catalog (spec section 8). This is CONTENT — the app-side source of
// truth for what exists, how it's acquired, and its gym-bro flavour text. The
// pipeline-owned `cosmetics`/`generated_images` tables only supply the ART
// (current approved image) at render time; until Phase 8 the app draws
// placeholder icons keyed off slot + rarity. Prices/acquisition are app concern.

export type CosmeticSlot =
  | 'head' | 'torso' | 'hands' | 'waist' | 'legs' | 'feet' // body-worn (loadout bake)
  | 'aura' | 'companion'                                   // runtime overlay layers
  | 'special'                                              // full-avatar replacement
  | 'title';                                               // name decoration (not a body slot)

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Currency = 'GRIT' | 'IRON';

/** Slots that draw on the avatar body via a cached loadout bake. */
export const BODY_SLOTS: CosmeticSlot[] = ['head', 'torso', 'hands', 'waist', 'legs', 'feet'];
/** Slots composited live as overlay layers. */
export const OVERLAY_SLOTS: CosmeticSlot[] = ['aura', 'companion'];
/** Every equippable slot, in equip-screen display order. */
export const ALL_SLOTS: CosmeticSlot[] = [...BODY_SLOTS, ...OVERLAY_SLOTS, 'special', 'title'];

export const SLOT_LABEL: Record<CosmeticSlot, string> = {
  head: 'Head', torso: 'Torso', hands: 'Hands', waist: 'Waist', legs: 'Legs', feet: 'Feet',
  aura: 'Aura', companion: 'Companion', special: 'Special', title: 'Title',
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8b919c',
  uncommon: '#6fae7a',
  rare: '#5b9bd5',
  epic: '#a974d8',
  legendary: '#e8a04b',
};

export const RARITY_RANK: Record<Rarity, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
};

/** How a cosmetic is acquired. */
export type Acquisition =
  | { type: 'shop'; currency: Currency; price: number }
  | { type: 'achievement'; achievementId: string }
  | { type: 'starter' };

export interface Cosmetic {
  slug: string;
  name: string;
  slot: CosmeticSlot;
  rarity: Rarity;
  acquire: Acquisition;
  /** Short, funny gym-bro description shown on the detail page (spec section 8). */
  description: string;
}

export const COSMETICS: Cosmetic[] = [
  // ── Starter ────────────────────────────────────────────────────────────────
  { slug: 'starter_tee', name: 'Plain Tee', slot: 'torso', rarity: 'common',
    acquire: { type: 'achievement', achievementId: 'first_rep' },
    description: "Where it all begins. No logo, no pump — yet. Everybody starts somewhere, bro." },

  // ── GRIT shop — earned by showing up ─────────────────────────────────────────
  { slug: 'tank_black', name: 'Black Cutoff Tank', slot: 'torso', rarity: 'common',
    acquire: { type: 'shop', currency: 'GRIT', price: 150 },
    description: "More armhole than shirt. Lets the delts breathe and the bros know." },
  { slug: 'joggers_olive', name: 'Olive Joggers', slot: 'legs', rarity: 'common',
    acquire: { type: 'shop', currency: 'GRIT', price: 120 },
    description: "Tapered so you can actually see the quads you swear you trained." },
  { slug: 'lifters_classic', name: 'Flat-Sole Lifters', slot: 'feet', rarity: 'uncommon',
    acquire: { type: 'shop', currency: 'GRIT', price: 220 },
    description: "Zero cushion, zero excuses. The floor is your friend now." },
  { slug: 'snapback', name: 'Backwards Snapback', slot: 'head', rarity: 'common',
    acquire: { type: 'shop', currency: 'GRIT', price: 140 },
    description: "Adds 5 kg to every lift. Source: trust me bro." },
  { slug: 'lever_belt', name: 'Lever Belt', slot: 'waist', rarity: 'uncommon',
    acquire: { type: 'shop', currency: 'GRIT', price: 320 },
    description: "Cinch it, brace it, scream a little. Bracing is free real estate." },
  { slug: 'chalk_grip', name: 'Chalk Hands', slot: 'hands', rarity: 'common',
    acquire: { type: 'shop', currency: 'GRIT', price: 90 },
    description: "Half on the bar, half on your shirt, all over the floor. Worth it." },
  { slug: 'spotter_drone', name: 'Spotter Drone', slot: 'companion', rarity: 'rare',
    acquire: { type: 'shop', currency: 'GRIT', price: 650 },
    description: "Hovers, beeps, believes in you. Will not actually catch the bar." },

  // ── Achievement grants ───────────────────────────────────────────────────────
  { slug: 'sweat_wristbands', name: 'Sweat Wristbands', slot: 'hands', rarity: 'common',
    acquire: { type: 'achievement', achievementId: 'habit_forming' },
    description: "Three days deep. The forearms are committed even if the brain isn't yet." },
  { slug: 'headband', name: 'Training Headband', slot: 'head', rarity: 'uncommon',
    acquire: { type: 'achievement', achievementId: 'locked_in' },
    description: "A full week. Keeps sweat out of your eyes and doubt out of your head." },
  { slug: 'consistency_crown', name: 'Consistency Crown', slot: 'head', rarity: 'rare',
    acquire: { type: 'achievement', achievementId: 'two_weeks_strong' },
    description: "Two weeks straight. Heavy is the head — but the traps can take it." },
  { slug: 'streak_aura', name: 'Streak Aura', slot: 'aura', rarity: 'epic',
    acquire: { type: 'achievement', achievementId: 'unbreakable' },
    description: "Thirty days. You now hum at a frequency only other gym bros can hear." },
  { slug: 'lifer_fit', name: 'The Lifer Fit', slot: 'special', rarity: 'legendary',
    acquire: { type: 'achievement', achievementId: 'the_lifer' },
    description: "One hundred days. This isn't a hobby anymore. This is who you are." },
  { slug: 'ember_accent', name: 'Ember Accent', slot: 'aura', rarity: 'rare',
    acquire: { type: 'achievement', achievementId: 'phoenix' },
    description: "Rose from the rust. A few stray embers follow you around as proof." },
  { slug: 'comeback_kid', name: 'Comeback Kid', slot: 'title', rarity: 'rare',
    acquire: { type: 'achievement', achievementId: 'back_at_it' },
    description: "Left. Came back. The bar was still here. So were you." },
  { slug: 'pr_machine_tag', name: 'PR Machine', slot: 'title', rarity: 'rare',
    acquire: { type: 'achievement', achievementId: 'pr_machine' },
    description: "Ten records and counting. The notebook is getting nervous." },

  // ── IRON shop — flashy, hardcore, gated behind raw output ─────────────────────
  { slug: 'iron_crown', name: 'Iron Crown', slot: 'head', rarity: 'epic',
    acquire: { type: 'shop', currency: 'IRON', price: 1200 },
    description: "Forged, not bought — well, both. Only the strong lane can afford it." },
  { slug: 'molten_plate_vest', name: 'Molten Plate Vest', slot: 'torso', rarity: 'epic',
    acquire: { type: 'shop', currency: 'IRON', price: 2000 },
    description: "Still warm from the foundry. Weighs nothing in pixels, everything in respect." },
  { slug: 'titan_greaves', name: 'Titan Greaves', slot: 'legs', rarity: 'epic',
    acquire: { type: 'shop', currency: 'IRON', price: 1500 },
    description: "Leg day made tangible. Cannot be worn by anyone who skips it." },
  { slug: 'soul_takeover', name: 'Soul Takeover', slot: 'special', rarity: 'legendary',
    acquire: { type: 'shop', currency: 'IRON', price: 5000 },
    description: "The avatar is gone. Something stronger wears it now. No notes." },
];

const BY_SLUG = new Map(COSMETICS.map((c) => [c.slug, c]));

export function getCosmetic(slug: string): Cosmetic | undefined {
  return BY_SLUG.get(slug);
}

/** Cosmetics granted by unlocking a given achievement. */
export function cosmeticsForAchievement(achievementId: string): Cosmetic[] {
  return COSMETICS.filter((c) => c.acquire.type === 'achievement' && c.acquire.achievementId === achievementId);
}

/** Buyable items (GRIT or IRON), in display order. */
export const SHOP_ITEMS = COSMETICS.filter((c) => c.acquire.type === 'shop');
