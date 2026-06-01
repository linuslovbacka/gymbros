// Achievement catalog (gymbros-achievements.md). These are CONTENT — tuned by
// editing this file, never user data. Each entry is a one-time unlock evaluated
// against an AchievementContext after a session is logged.
//
// Repeatable "New Heights" GRIT (per PR) is paid out directly in the store, not
// modelled here. IRON strength milestones (Phase 7), Resilience/comeback
// (Phase 3 rust) and Bro/Social (Phase 6) live in their own phases. A few
// achievements that need richer history (Never Skips, Five-Plate Mind, Cardio
// Counts) are intentionally deferred and noted at the bottom.

export type AchievementCategory = 'consistency' | 'pr' | 'variety';
export type Currency = 'GRIT' | 'IRON';

/** Everything an achievement check is allowed to look at. */
export interface AchievementContext {
  /** Current daily streak (consecutive trained days). */
  streak: number;
  /** Total sessions logged ever. */
  totalSessions: number;
  /** Lifetime PR count. */
  prCount: number;
  /** Distinct exercises ever logged. */
  distinctExercises: number;
  /** Account age in whole days. */
  accountAgeDays: number;
  /** Muscle groups trained in the last 7 days ('upper' | 'lower' | 'core'). */
  groupsLast7: Set<string>;
  /** Sessions this calendar month that included a legs exercise. */
  legSessionsThisMonth: number;
}

export interface Achievement {
  id: string;
  name: string;
  category: AchievementCategory;
  description: string;
  currency: Currency;
  amount: number;
  check: (c: AchievementContext) => boolean;
}

const MUSCLE_GROUPS = ['upper', 'lower', 'core'] as const;

export const ACHIEVEMENTS: Achievement[] = [
  // ── Consistency ──────────────────────────────────────────────────────────
  { id: 'first_rep', name: 'First Rep', category: 'consistency',
    description: 'Log your very first session.', currency: 'GRIT', amount: 50,
    check: (c) => c.totalSessions >= 1 },
  { id: 'habit_forming', name: 'Habit Forming', category: 'consistency',
    description: 'Hit a 3-day streak.', currency: 'GRIT', amount: 30,
    check: (c) => c.streak >= 3 },
  { id: 'locked_in', name: 'Locked In', category: 'consistency',
    description: 'Hit a 7-day streak.', currency: 'GRIT', amount: 60,
    check: (c) => c.streak >= 7 },
  { id: 'two_weeks_strong', name: 'Two Weeks Strong', category: 'consistency',
    description: 'Hit a 14-day streak.', currency: 'GRIT', amount: 100,
    check: (c) => c.streak >= 14 },
  { id: 'unbreakable', name: 'Unbreakable', category: 'consistency',
    description: 'Hit a 30-day streak.', currency: 'GRIT', amount: 200,
    check: (c) => c.streak >= 30 },
  { id: 'the_lifer', name: 'The Lifer', category: 'consistency',
    description: 'Hit a 100-day streak.', currency: 'GRIT', amount: 500,
    check: (c) => c.streak >= 100 },

  // ── Personal Records ─────────────────────────────────────────────────────
  { id: 'pr_machine', name: 'PR Machine', category: 'pr',
    description: 'Set 10 personal records.', currency: 'GRIT', amount: 100,
    check: (c) => c.prCount >= 10 },
  { id: 'beginner_gains', name: 'Beginner Gains', category: 'pr',
    description: 'Set 5 PRs in your first 4 weeks.', currency: 'GRIT', amount: 120,
    check: (c) => c.accountAgeDays <= 28 && c.prCount >= 5 },

  // ── Variety ──────────────────────────────────────────────────────────────
  { id: 'explorer', name: 'Explorer', category: 'variety',
    description: 'Try 10 different exercises.', currency: 'GRIT', amount: 80,
    check: (c) => c.distinctExercises >= 10 },
  { id: 'full_sweep', name: 'Full Sweep', category: 'variety',
    description: 'Train every muscle group in one week.', currency: 'GRIT', amount: 60,
    check: (c) => MUSCLE_GROUPS.every((g) => c.groupsLast7.has(g)) },
  { id: 'leg_day_believer', name: 'Leg Day Believer', category: 'variety',
    description: 'Train legs 4 times in one month.', currency: 'GRIT', amount: 100,
    check: (c) => c.legSessionsThisMonth >= 4 },
];

/** GRIT paid out per PR (repeatable "New Heights", gymbros-achievements.md). */
export const PR_GRIT = 25;
