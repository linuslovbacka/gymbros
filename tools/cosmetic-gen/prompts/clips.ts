// Per-clip frame choreography (generation-spec §5/§6). Frame 0 of every clip is
// conditioned on the base sprite via image-to-image; subsequent frames are also
// edits of frame 0 ("same character, same everything, now ...") so the model can't
// drift. sheet.ts packs the frames — these strings NEVER mention the strip/layout.
//
// The flex/taunt clip is PARAMETERIZED PER TIER: the flat-bicep defeated punchline
// is tier-1 only; higher tiers pay off with a real bulge and pride. The animation
// itself carries the progression joke.

export type ClipName = 'idle' | 'flex';

export const CLIP_FPS: Record<ClipName, number> = {
  idle: 6,
  flex: 8,
};

/** Idle "breathing" loop — tier-independent. Frame 0 == the neutral base pose. */
export const IDLE_FRAMES: string[] = [
  'standing in the neutral resting base pose, weight settled',
  'chest lifted 1px, shoulders raised slightly (inhale)',
  'returning toward the neutral resting pose',
  'head dipped 1px, shoulders settled (exhale)',
];

/** Flex / taunt one-shot — per tier. Tier 1 = the defeated flat-bicep gag;
 *  mid tiers = a real flex; top tiers = a dominant power flex. */
export function flexFrames(tier: number): string[] {
  if (tier <= 1) {
    return [
      'raising the right arm into a flex pose',
      'flexing the right bicep — the bicep stays COMPLETELY FLAT with no bulge at all, looking down at it',
      'the other hand pointing at the unimpressive flat arm',
      'both arms dropping, shoulders slumping, head lowered in defeat',
    ];
  }
  if (tier <= 3) {
    return [
      'raising the right arm into a flex pose',
      'flexing the right bicep showing a modest but real bulge, glancing at it with mild approval',
      'turning slightly to present the flex, small confident nod',
      'lowering the arm back toward neutral, standing a little prouder',
    ];
  }
  return [
    'raising the right arm into a powerful flex',
    'flexing a huge defined bicep that strains the sleeve, jaw set, dominant expression',
    'twisting to present a full double-arm power flex, chest puffed',
    'holding the dominant pose, then settling proudly back toward neutral',
  ];
}

export function clipFrames(clip: ClipName, tier: number): string[] {
  return clip === 'idle' ? IDLE_FRAMES : flexFrames(tier);
}
