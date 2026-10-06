import type { ExerciseState, ProgramStage } from '../content/workouts';
import type { RustState } from '../engine/rust';
import type { CosmeticSlot } from '../content/cosmetics';

/** Equipped cosmetic per RPG slot (slug or absent). */
export type EquipMap = Partial<Record<CosmeticSlot, string | null>>;

/** One row in `daily_habits` for a calendar day. */
export interface DailyHabitsRow {
  user_id: string;
  date: string;
  no_sugar: boolean;
  protein_met: boolean;
  water_met: boolean;
  sick: boolean;
  updated_at?: string;
}

export type HabitsToday = Pick<DailyHabitsRow, 'no_sugar' | 'protein_met' | 'water_met' | 'sick'>;

/** Mirrors the `profiles` row. JSONB columns are typed loosely for Phase 1. */
export interface Profile {
  user_id: string;
  pair_id: string | null;
  display_name: string | null;
  side: 'left' | 'right' | null;
  upper_tier: number;
  lower_tier: number;
  iron: number;
  iron_lifetime: number;
  grit: number;
  pro_mode_level: number;
  streak_count: number;
  streak_last_date: string | null;
  rest_tokens: number;
  rest_tokens_month: string | null;
  rust_state: RustState;
  equipped: EquipMap;
  owned_cosmetics: string[];
  unlocked_achievements: string[];
  avatar_base_prompt: string | null;
  exercise_state: ExerciseState;
  program_stage: ProgramStage;
  days_trained: number;
  pr_count: number;
  protein_target_g?: number;
  maintenance_mode?: boolean;
  created_at: string;
  updated_at: string;
}

/** Columns the client is allowed to write back (RLS enforces ownership too). */
export const WRITABLE_PROFILE_COLUMNS = [
  'upper_tier',
  'lower_tier',
  'iron',
  'iron_lifetime',
  'grit',
  'pro_mode_level',
  'streak_count',
  'streak_last_date',
  'rest_tokens',
  'rest_tokens_month',
  'rust_state',
  'equipped',
  'owned_cosmetics',
  'unlocked_achievements',
  'avatar_base_prompt',
  'exercise_state',
  'program_stage',
  'days_trained',
  'pr_count',
  'display_name',
  'protein_target_g',
  'maintenance_mode',
] as const;
