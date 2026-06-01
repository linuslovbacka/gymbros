// Per-tier physique + default clothing layer (generation-spec §5/§6). Only the
// physique and starter clothing change per tier; style (base-style.ts) and identity
// (players.ts) stay constant so the character holds across the transformation.
//
// Tier 1 is the fully-decomposed reference (the scrawny beginner). Tiers 2-6 are
// the escalation ladder — deliberately grounded early so the late tiers land harder.
// These are editable drafts; refine then re-run `gen avatar <player> <tier>`.

export const MIN_TIER = 1;
export const MAX_TIER = 6;

export interface TierDef {
  tier: number;
  label: string;
  physique: string;
}

export const TIERS: Record<number, TierDef> = {
  1: {
    tier: 1,
    label: 'Scrawny beginner',
    physique: [
      'PHYSIQUE: scrawny and underdeveloped — narrow shoulders barely wider than the hips,',
      'thin straight arms with no visible muscle, flat narrow chest, mild forward slouch;',
      'a weak beginner who has never trained.',
      'CLOTHING: oversized off-white tee (#D8D0B8) hanging off the thin frame,',
      'baggy olive-grey joggers (#5A6258), scuffed low brown sneakers (#282420).',
    ].join(' '),
  },
  2: {
    tier: 2,
    label: 'Beginner gains',
    physique: [
      'PHYSIQUE: slightly filled out — shoulders a touch wider, arms with the faint start of tone,',
      'posture a little straighter but still lean. Early newbie gains.',
      'CLOTHING: a tee that now fits properly (#C9BE9E), the same joggers, the same worn sneakers.',
    ].join(' '),
  },
  3: {
    tier: 3,
    label: 'Visibly training',
    physique: [
      'PHYSIQUE: visibly fitter — defined shoulders, arms with clear muscle shape, fuller chest,',
      'confident upright stance. Looks like someone who lifts regularly now.',
      'CLOTHING: fitted athletic t-shirt (#B0A57E), training shorts (#4C5248), proper trainers.',
    ].join(' '),
  },
  4: {
    tier: 4,
    label: 'Strong',
    physique: [
      'PHYSIQUE: strong and athletic — broad shoulders, well-developed arms and chest,',
      'visible muscle separation, powerful grounded stance.',
      'CLOTHING: snug tank top (#9A8F66) over a clearly muscular frame, training shorts, lifting shoes.',
    ].join(' '),
  },
  5: {
    tier: 5,
    label: 'Powerful',
    physique: [
      'PHYSIQUE: imposing and powerful — thick muscle, wide back, heavy arms, dense chest,',
      'a clearly dominant lifter. Veins faintly suggested with value contrast only.',
      'CLOTHING: stretched compression tank (#8A7F58), fitted shorts, heavy lifting shoes.',
    ].join(' '),
  },
  6: {
    tier: 6,
    label: 'Unhinged peak',
    physique: [
      'PHYSIQUE: absurd peak physique — enormous, exaggerated heroic muscle mass that strains',
      'the silhouette, towering dominant stance. The grounded early style escalates into',
      'over-the-top late-game power fantasy (still flat-shaded, still on-palette, never neon).',
      'CLOTHING: torn/strained tank barely containing the frame (#7C724E), minimal shorts, heavy boots.',
    ].join(' '),
  },
};

export function getTier(tier: number): TierDef {
  const t = TIERS[tier];
  if (!t) throw new Error(`Unknown tier ${tier}. Valid tiers: ${MIN_TIER}-${MAX_TIER}`);
  return t;
}
