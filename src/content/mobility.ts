/** Logged TRAIN mobility — one-line cues per stretch (breathe, no bouncing). */
export const MOBILITY_STRETCH_GUIDE: Record<string, { title: string; cue: string }> = {
  mobility_prep: {
    title: 'Prep',
    cue: 'Cat-cow on hands and knees, then slow arm circles — 2 min total, easy range.',
  },
  mobility_pike: {
    title: 'Pike',
    cue: 'Hinge from hips; keep spine long. Bend knees if hamstrings are tight.',
  },
  mobility_pancake: {
    title: 'Pancake / straddle sit',
    cue: 'Sit tall, fold forward between legs or over one leg — no forcing.',
  },
  mobility_front_split: {
    title: 'Front split progression',
    cue: 'Half-kneeling lunge or blocks — front knee over ankle, hips square.',
  },
  mobility_side_split: {
    title: 'Side split / wide straddle',
    cue: 'Wide stance or seated straddle — lean with a flat back, support hands on floor.',
  },
  mobility_pigeon: {
    title: 'Pigeon',
    cue: 'Figure-4 seated or floor pigeon — glute stretch, square hips.',
  },
};

export const MOBILITY_SESSION_INTRO = {
  title: 'Mobility session',
  intro: 'Hold each stretch for the timer. Use the easiest rung that still feels like work — no bouncing.',
  when: 'On rest days or when you want a dedicated hips/hamstrings block. Counts toward your Mobility habit when you finish.',
} as const;

export type CooldownVariant = 'upper' | 'lower' | 'full';

export const COOLDOWN_STEP = {
  title: 'Optional cooldown',
  intro: '5–10 min easy stretching after Main. Counts toward your Mobility habit if you finish.',
  skipLabel: 'Skip cooldown',
  doneLabel: 'Done — finish session',
} as const;

export interface MobilityGuideSection {
  title: string;
  items: string[];
}

export const MOBILITY_GUIDE = {
  sheetTitle: 'Cooldown',
  sheetMeta: 'Optional finisher after Main',
  intro: 'Move slow — no bouncing. For a full timed mobility block on rest days, use TRAIN → Mobility.',
  upper: {
    cooldown: {
      title: 'Upper day — cooldown (5–10 min)',
      items: [
        'Cat-cow → cobra hold',
        'Thread the needle (each side)',
        'Pigeon or figure-4 (each side)',
        'Wall slides / shoulder CARs',
        'Dead bug or bird dog',
      ],
    },
    betweenRounds: {
      title: 'Between rounds (optional, 1–2 min)',
      items: ['Arm circles', 'Scapular wall slides', 'Dead bug'],
    },
  },
  lower: {
    cooldown: {
      title: 'Lower day — cooldown (5–10 min)',
      items: [
        'Hip CARs (each side)',
        'Deep squat hold',
        'Hamstring stretch (seated or standing)',
        'Figure-four / pigeon (each side)',
        'Single-leg balance → bodyweight RDL reach',
      ],
    },
    betweenRounds: {
      title: 'Between rounds (optional, 1–2 min)',
      items: ['Ankle circles', 'Hip CARs', 'Single-leg balance'],
    },
  },
} as const;

export const MOBILITY_HABIT_LABEL = '5+ min today';

export function cooldownSections(
  variant: CooldownVariant,
): { title: string; items: readonly string[] }[] {
  if (variant === 'upper') return [MOBILITY_GUIDE.upper.cooldown];
  if (variant === 'lower') return [MOBILITY_GUIDE.lower.cooldown];
  return [MOBILITY_GUIDE.upper.cooldown, MOBILITY_GUIDE.lower.cooldown];
}

export function cooldownVariantForMain(
  kind: 'full' | 'split',
  splitDay: 'upper' | 'lower',
): CooldownVariant {
  return kind === 'full' ? 'full' : splitDay;
}
