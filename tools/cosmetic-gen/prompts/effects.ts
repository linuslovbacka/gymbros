// Fire-vortex stage prompts (generation-spec §4/§5). The vortex is a SYSTEM
// progress overlay, NOT an equippable aura. Generated once as neutral/white,
// currency-agnostic loops; the app tints per currency at runtime (orange GRIT /
// cold blue IRON). 5 fixed intensity stages driven by currentXP / threshold.

export const VORTEX_STAGES = [1, 2, 3, 4, 5] as const;
export type VortexStage = (typeof VORTEX_STAGES)[number];

/** Frames per vortex loop clip (idle-style breathing flame). */
export const VORTEX_FRAMES = 4;
export const VORTEX_FPS = 8;

const STAGE_INTENSITY: Record<VortexStage, string> = {
  1: 'a faint thin ring of low flames around the feet, barely flickering',
  2: 'a low swirling flame vortex rising to the knees, gentle motion',
  3: 'a steady flame vortex swirling up to the waist, clear upward spiral',
  4: 'a strong roaring flame vortex up to the chest, energetic spiral and upward licks',
  5: 'a massive towering flame vortex engulfing the full height, intense churning spiral and rising sparks',
};

export function vortexPrompt(stage: VortexStage): string {
  return [
    STAGE_INTENSITY[stage],
    'NEUTRAL WHITE-HOT flames only — desaturated white/pale, NO colour tint (the app tints it).',
    'Just the flame vortex effect isolated and centered, NO character, NO ground, on the flat removal background.',
    'Same flat-block pixel style, hard edges, max 3 values, light upper-left, visible pixels.',
  ].join(' ');
}
