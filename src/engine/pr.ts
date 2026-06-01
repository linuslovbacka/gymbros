import type { ExerciseState } from '../content/workouts';
import { getExercise } from '../content/exercises';
import type { LoggedEntry } from './types';

/** A personal record set during a session. */
export interface PR {
  exerciseId: string;
  name: string;
  kind: 'reps' | 'weight' | 'rung';
  /** Human-readable summary, e.g. "12 reps" or "40 kg". */
  detail: string;
}

/**
 * A session's effort for one exercise reduced to a comparable (rank, value):
 *  - calisthenics: rank = ladder rung index, value = best single-set reps/seconds
 *  - gym:          rank = heaviest weight used, value = best reps at that weight
 * PRs compare lexicographically — a higher rung always beats more reps on a lower
 * rung, and more weight always beats more reps at a lighter load.
 */
function effort(entry: LoggedEntry): { rank: number; value: number } {
  const sets = entry.sets ?? [];
  if (entry.track === 'gym') {
    const rank = Math.max(entry.weightKg ?? 0, ...sets.map((s) => s.weightKg ?? entry.weightKg ?? 0));
    const value = Math.max(0, ...sets.filter((s) => (s.weightKg ?? entry.weightKg ?? 0) >= rank).map((s) => s.value));
    return { rank, value };
  }
  const value = Math.max(0, ...sets.map((s) => s.value));
  return { rank: entry.rungIndex, value };
}

function prDetail(entry: LoggedEntry, rank: number, value: number): { kind: PR['kind']; detail: string } {
  if (entry.track === 'gym') {
    const climbed = (entry.weightKg ?? 0) >= rank;
    return climbed && value
      ? { kind: 'reps', detail: `${value} reps @ ${rank} kg` }
      : { kind: 'weight', detail: `${rank} kg` };
  }
  const unit = entry.timed ? 's' : ' reps';
  return { kind: 'reps', detail: `${value}${unit}` };
}

/**
 * Detect PRs for a session and fold the new bests back into exercise_state.
 * The first time an exercise is ever logged we record a baseline silently —
 * only genuine improvements over a prior best count as a PR.
 */
export function detectPRs(
  state: ExerciseState,
  entries: LoggedEntry[],
): { state: ExerciseState; prs: PR[] } {
  const next: ExerciseState = { ...state };
  const prs: PR[] = [];

  for (const entry of entries) {
    const { rank, value } = effort(entry);
    if (value <= 0 && rank <= 0) continue;

    const prev = state[entry.exerciseId];
    const hasBaseline = prev?.prRank != null && prev?.prValue != null;
    const beats =
      hasBaseline && (rank > prev!.prRank! || (rank === prev!.prRank! && value > prev!.prValue!));

    if (!hasBaseline || beats) {
      next[entry.exerciseId] = { ...next[entry.exerciseId], prRank: rank, prValue: value };
    }

    if (beats) {
      const { kind, detail } = prDetail(entry, rank, value);
      prs.push({ exerciseId: entry.exerciseId, name: getExercise(entry.exerciseId).name, kind, detail });
    }
  }

  return { state: next, prs };
}
