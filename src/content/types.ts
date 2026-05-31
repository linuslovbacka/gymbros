// Static content types. Exercises, ladders, and frameworks are CONTENT (shipped
// in code and tuned by editing), never user data.

export type Track = 'calisthenics' | 'gym';
export type Body = 'upper' | 'lower' | 'core' | 'skill';
export type Mode = 'home' | 'gym';
export type Direction = 'up' | 'forward' | 'down';
export type Force = 'pull' | 'push';

/** One rung on a variation ladder (calisthenics) — see spec section 6. */
export interface Rung {
  name: string;
  sets: number;
  /** Human label for the prescription, e.g. "3-8", "30 s", "8-12 each". */
  prescription: string;
  /** Bottom of the working rep range (or hold seconds). */
  low: number;
  /** Top of the range — the ceiling that triggers progression. */
  high: number;
  /** Hold measured in seconds rather than reps. */
  timed?: boolean;
  /** Counted per side (e.g. archer, pistol). */
  perSide?: boolean;
  /** IRON multiplier, calibrated so one bodyweight pull-up = 2.0. */
  ironMultiplier: number;
}

/** Pure weight progression scheme for gym lifts (no variation ladder). */
export interface WeightProgression {
  low: number;
  high: number;
  incrementKg: number;
  startKg: number;
}

export interface Exercise {
  id: string;
  name: string;
  track: Track;
  body: Body;
  /** Spec grouping label, e.g. "Home: Up Pull", "Skill", "Legs". */
  category: string;
  videoUrl?: string;
  /** Calisthenics: ordered variation ladder. Empty for gym lifts. */
  ladder: Rung[];
  /** Gym lifts only. */
  weight?: WeightProgression;
}
