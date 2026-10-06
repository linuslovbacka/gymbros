/** Default daily protein goal (g) when `profiles.protein_target_g` is unset. */
export const DEFAULT_PROTEIN_TARGET_G = 110;

/** Extra protein when `maintenance_mode` is on (not trying to cut hard). */
export const MAINTENANCE_PROTEIN_BONUS_G = 25;

export const WATER_TARGET_LABEL = '1.5–2 L / day';

export function proteinTargetG(profile?: {
  protein_target_g?: number;
  maintenance_mode?: boolean;
} | null): number {
  const base = profile?.protein_target_g;
  const n = typeof base === 'number' && base > 0 ? base : DEFAULT_PROTEIN_TARGET_G;
  return profile?.maintenance_mode ? n + MAINTENANCE_PROTEIN_BONUS_G : n;
}

export interface DietRestriction {
  id: string;
  title: string;
  detail: string;
}

export interface DietGoal {
  id: string;
  title: string;
  detail: string;
  targetLabel?: string;
}

export interface HandRulePortion {
  id: string;
  title: string;
  measure: string;
  examples: string;
}

/** MVP diet rules — extend when nutrition tracking ships. */
export const DIET_RESTRICTIONS: DietRestriction[] = [
  {
    id: 'no_sugar',
    title: 'No sugar',
    detail: 'No sweets, soda, or added sugar for the day. Whole fruit is fine.',
  },
  {
    id: 'salt',
    title: 'Salt',
    detail: 'Use salt sparingly; iodized salt is fine in normal cooking.',
  },
  {
    id: 'caffeine',
    title: 'Coffee & tea',
    detail: 'Go easy on caffeine, especially late in the day. Plant or low-fat milk if you use milk.',
  },
];

export function dietGoals(proteinTarget: number): DietGoal[] {
  return [
    {
      id: 'protein',
      title: 'Protein',
      detail: 'Hit your daily protein target to support recovery and your habit score.',
      targetLabel: `${proteinTarget} g / day`,
    },
    {
      id: 'water',
      title: 'Water',
      detail: 'Mostly water; coffee, tea, and protein shakes count toward fluids.',
      targetLabel: WATER_TARGET_LABEL,
    },
  ];
}

/** Portion guide without scales (hand rule). */
export const HAND_RULE_PORTIONS: HandRulePortion[] = [
  {
    id: 'protein',
    title: 'Protein',
    measure: '1 palm (cooked)',
    examples: 'Chicken, fish, eggs, tofu, legumes, yogurt, protein powder.',
  },
  {
    id: 'veg',
    title: 'Vegetables',
    measure: '1 fist (raw)',
    examples: 'Salad, broccoli, peppers, carrots, greens — load up.',
  },
  {
    id: 'carbs',
    title: 'Carbs',
    measure: '1 fist or palm (cooked)',
    examples: 'Rice, oats, potato, quinoa, whole-grain bread — size to your hand.',
  },
  {
    id: 'fats',
    title: 'Fats',
    measure: '1 thumb or a splash',
    examples: 'Olive oil, nuts, seeds, avocado.',
  },
  {
    id: 'flavor',
    title: 'Flavor',
    measure: 'Free',
    examples: 'Herbs, spices, vinegar, garlic, chili — watch salty premixes.',
  },
];

export const SICK_DAY_TRAINING_NOTE =
  'Training is skipped today. Keep no-sugar, protein, and water habits — mark “I’m sick” on home to rest.';

export const SICK_DAY_SCHEDULE_NOTE =
  'When you’re sick, don’t catch up missed workouts — rejoin the current day on the schedule when you’re well.';
