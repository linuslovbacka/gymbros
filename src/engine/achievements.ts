import {
  ACHIEVEMENTS,
  type Achievement,
  type AchievementContext,
} from '../content/achievements';
import { getExercise } from '../content/exercises';
import type { LoggedEntry } from './types';

/** Minimal shape of a session row needed to build the context. */
export interface SessionLite {
  created_at: string;
  entries: LoggedEntry[];
}

export interface AchievementUnlock {
  id: string;
  name: string;
  description: string;
  currency: 'GRIT' | 'IRON';
  amount: number;
}

export interface EvaluateInput {
  streak: number;
  prCount: number;
  distinctExercises: number;
  accountAgeDays: number;
  alreadyUnlocked: Set<string>;
  /** Recent sessions (last ~31 days) INCLUDING the one just completed. */
  recentSessions: SessionLite[];
  /** Resilience signals computed from the rust engine for this session. */
  justReturned: boolean;
  deRusted: boolean;
  comebackCount: number;
  /** Bro/social signals (computed from partner profile + sessions). */
  partnerTrainedToday: boolean;
  bothStreak14: boolean;
  combinedWeekIron: number;
}

function bodiesOf(entries: LoggedEntry[]): Set<string> {
  const set = new Set<string>();
  for (const e of entries) set.add(getExercise(e.exerciseId).body);
  return set;
}

function buildContext(input: EvaluateInput): AchievementContext {
  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const monthKey = new Date().toISOString().slice(0, 7);

  const groupsLast7 = new Set<string>();
  let legSessionsThisMonth = 0;

  for (const s of input.recentSessions) {
    const t = new Date(s.created_at).getTime();
    const bodies = bodiesOf(s.entries ?? []);
    if (t >= weekAgo) bodies.forEach((b) => groupsLast7.add(b));
    if (s.created_at.slice(0, 7) === monthKey && bodies.has('lower')) legSessionsThisMonth += 1;
  }

  return {
    streak: input.streak,
    totalSessions: input.recentSessions.length,
    prCount: input.prCount,
    distinctExercises: input.distinctExercises,
    accountAgeDays: input.accountAgeDays,
    groupsLast7,
    legSessionsThisMonth,
    justReturned: input.justReturned,
    deRusted: input.deRusted,
    comebackCount: input.comebackCount,
    partnerTrainedToday: input.partnerTrainedToday,
    bothStreak14: input.bothStreak14,
    combinedWeekIron: input.combinedWeekIron,
  };
}

/**
 * Returns achievements unlocked by this session (excluding ones already owned),
 * along with the GRIT/IRON they pay out.
 */
export function evaluateAchievements(input: EvaluateInput): {
  unlocked: AchievementUnlock[];
  gritAward: number;
  ironAward: number;
} {
  const ctx = buildContext(input);
  const unlocked: AchievementUnlock[] = [];
  let gritAward = 0;
  let ironAward = 0;

  for (const a of ACHIEVEMENTS as Achievement[]) {
    if (input.alreadyUnlocked.has(a.id)) continue;
    if (!a.check(ctx)) continue;
    unlocked.push({ id: a.id, name: a.name, description: a.description, currency: a.currency, amount: a.amount });
    if (a.currency === 'GRIT') gritAward += a.amount;
    else ironAward += a.amount;
  }

  return { unlocked, gritAward, ironAward };
}
