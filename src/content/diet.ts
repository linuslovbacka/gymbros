/** Default daily protein goal (g) when `profiles.protein_target_g` is unset. */
export const DEFAULT_PROTEIN_TARGET_G = 110;

/** Extra protein when performance/bulk mode is on (`profiles.maintenance_mode`). */
export const PERFORMANCE_BULK_PROTEIN_BONUS_G = 25;

/** UI copy — DB flag remains `maintenance_mode` for compatibility. */
export const PERFORMANCE_BULK_PROTEIN = {
  sectionTitle: 'Performance / bulk',
  toggleOn: 'Performance / bulk (+protein)',
  toggleOff: 'Switch to performance / bulk',
  hint: 'Adds extra protein on top of your base target — use when you’re pushing size or strength, not for an “easy” phase.',
  bonusLabel: 'performance / bulk',
} as const;

export const WATER_TARGET_LABEL = '1.5–2 L / day';

export const SLEEP_TARGET_LABEL = '7+ h last night';

export const STEPS_TARGET_LABEL = '~10k or walk after meals';

/** Diet screen — ties habits to sleep (no biomarker tracking). */
export const DIET_HABITS_WHY_LEAD =
  'Poor sleep and late caffeine make no-sugar, protein, and training harder. Protect sleep first, then stack the daily habits.';

/** Home no-sugar row subtitle. */
export const NO_SUGAR_HABIT_HINT = 'Plan before evening';

/** Standard creatine monohydrate maintenance dose (g/day). */
export const CREATINE_DAILY_G = 5;

export const CREATINE_GUIDE = {
  title: 'Creatine',
  targetLabel: `${CREATINE_DAILY_G} g/day`,
  summary:
    '5 g per day of creatine monohydrate is the usual maintenance dose — safe for most healthy people and well supported for strength and training.',
  bullets: [
    'Use creatine monohydrate (powder in water/shake is fine).',
    'Timing doesn’t matter much — same time each day is easiest to remember.',
    'Drink enough water; fits with your daily fluid habit.',
    'Optional loading (20 g/day split × ~5 days) is not required — 5 g/day works, just fills stores more slowly.',
    'Skip or ask a clinician first if you have kidney disease or other medical conditions.',
  ],
} as const;

/** Base daily protein from body weight (g/kg) — stored in `protein_target_g`; performance/bulk adds a flat bonus. */
export const PROTEIN_G_PER_KG = 1.8;

export function proteinBaseFromWeightKg(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return DEFAULT_PROTEIN_TARGET_G;
  return Math.round(weightKg * PROTEIN_G_PER_KG);
}

export function bmiFromMetrics(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi: number): { label: string; detail: string } {
  if (bmi < 18.5) return { label: 'Underweight', detail: 'Below 18.5 — focus on fueling training and recovery.' };
  if (bmi < 25) return { label: 'Normal', detail: '18.5–24.9 — general healthy range for most adults.' };
  if (bmi < 30) return { label: 'Overweight', detail: '25–29.9 — habits and training matter more than the number alone.' };
  return { label: 'Obese', detail: '30+ — use as context; talk to a clinician for personal advice.' };
}

export function proteinMetFromLogged(loggedG: number, targetG: number): boolean {
  return loggedG >= targetG;
}

export function proteinTargetG(profile?: {
  protein_target_g?: number;
  maintenance_mode?: boolean;
} | null): number {
  const base = profile?.protein_target_g;
  const n = typeof base === 'number' && base > 0 ? base : DEFAULT_PROTEIN_TARGET_G;
  return profile?.maintenance_mode ? n + PERFORMANCE_BULK_PROTEIN_BONUS_G : n;
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

export interface ProteinAlternative {
  id: string;
  name: string;
  /** Approx. protein in one fist-sized portion (closed fist ≈ 1 cup volume). */
  fistProteinG: string;
  detail: string;
}

/** Overlay copy — fist portions scale with hand size; grams are typical ranges. */
export const PROTEIN_ALTERNATIVES_GUIDE = {
  title: 'Protein alternatives',
  intro:
    'Lean, whole-food options that count toward your daily target. Log grams on home as you eat.',
  fistRule: {
    title: 'Fist = portion size',
    measure: 'Closed fist (no thumb)',
    volumeNote: 'Roughly 1 cup of food by volume — scales with your hand.',
    leanMeatG: '25–30 g protein',
    leanMeatDetail:
      'For cooked chicken, turkey, lean beef, white fish, or firm tofu — one fist-sized serving is usually about 25–30 g protein.',
  },
  alternatives: [
    {
      id: 'chicken',
      name: 'Chicken / turkey breast',
      fistProteinG: '25–30 g',
      detail: 'Grilled, baked, or rotisserie — skinless keeps fat in check.',
    },
    {
      id: 'fish',
      name: 'White fish / salmon',
      fistProteinG: '22–28 g',
      detail: 'Cod, haddock, tilapia, or a fist of salmon (salmon runs a bit fattier).',
    },
    {
      id: 'eggs',
      name: 'Eggs',
      fistProteinG: '12–14 g',
      detail: 'About 2 large eggs — not a full fist of volume, but a quick palm-sized serving.',
    },
    {
      id: 'greek',
      name: 'Greek yogurt / skyr',
      fistProteinG: '15–20 g',
      detail: 'One fist of tub in a bowl — pick plain, add fruit yourself.',
    },
    {
      id: 'cottage',
      name: 'Cottage cheese',
      fistProteinG: '18–22 g',
      detail: 'Low-fat varieties pack more protein per fist than regular.',
    },
    {
      id: 'tofu',
      name: 'Firm tofu / tempeh',
      fistProteinG: '18–25 g',
      detail: 'Press tofu for better texture; tempeh is denser — aim for a solid fist cube.',
    },
    {
      id: 'legumes',
      name: 'Lentils / beans',
      fistProteinG: '12–18 g',
      detail: 'Cooked — pair with grains or dairy for a full meal; less dense than meat per fist.',
    },
    {
      id: 'powder',
      name: 'Whey / plant shake',
      fistProteinG: '20–25 g',
      detail: 'One scoop in water or milk — use the label; good when you’re short on time.',
    },
  ] satisfies ProteinAlternative[],
  palmNote:
    'For meat and fish, many coaches use a palm (thickness included) instead of a fist — same ballpark: ~25–30 g protein per palm for lean cuts.',
} as const;

/** MVP diet rules — extend when nutrition tracking ships. */
export const DIET_RESTRICTIONS: DietRestriction[] = [
  {
    id: 'no_sugar',
    title: 'No sugar',
    detail:
      'No sweets, soda, or added sugar for the day. Whole fruit is fine. Decide before cravings hit — evening-you will always sell you out.',
  },
  {
    id: 'salt',
    title: 'Salt',
    detail: 'Use salt sparingly; iodized salt is fine in normal cooking.',
  },
  {
    id: 'caffeine',
    title: 'Coffee & tea',
    detail:
      'Go easy on caffeine; try none after ~2 pm (half-life ~6 h). Plant or low-fat milk if you use milk.',
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
  'Training is skipped today. Keep sleep, no-sugar, protein, water, steps, creatine, and mobility — mark “I’m sick” on home to rest.';

/** Static reference — October plan eating window & fuel (no tracking in app). */
export const DIET_PROGRAM_TIPS = {
  title: 'Program reference',
  items: [
    'Try to finish eating by ~19:00 when you can — easier sleep and morning appetite.',
    'Rough maintenance often lands ~2,400–2,800 kcal for active men; adjust by scale and energy.',
    'Protein shake or skyr helps close the gap when whole food is short — log grams on home.',
  ],
} as const;

export const SICK_DAY_SCHEDULE_NOTE =
  'When you’re sick, don’t catch up missed workouts — rejoin the current day on the schedule when you’re well.';
