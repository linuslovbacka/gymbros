import type { ExerciseState, ProgramStage } from '../content/workouts';

/** Mirrors the `profiles` row. JSONB columns are typed loosely for Phase 1. */
export interface Profile {
  user_id: string;
  pair_id: string | null;
  display_name: string | null;
  side: 'left' | 'right' | null;
  upper_tier: number;
  lower_tier: number;
  iron: number;
  grit: number;
  pro_mode_level: number;
  streak_count: number;
  streak_last_date: string | null;
  rest_tokens: number;
  rest_tokens_month: string | null;
  rust_state: Record<string, unknown>;
  equipped: Record<string, unknown>;
  owned_cosmetics: unknown[];
  unlocked_achievements: unknown[];
  exercise_state: ExerciseState;
  program_stage: ProgramStage;
  days_trained: number;
  pr_count: number;
  created_at: string;
  updated_at: string;
}

/** Columns the client is allowed to write back (RLS enforces ownership too). */
export const WRITABLE_PROFILE_COLUMNS = [
  'upper_tier',
  'lower_tier',
  'iron',
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
  'exercise_state',
  'program_stage',
  'days_trained',
  'pr_count',
  'display_name',
] as const;
