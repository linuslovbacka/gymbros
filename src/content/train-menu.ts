import { ROUTINE_LABELS, type WorkoutRoutine } from './routines';
import type { Mode, SplitDay } from './types';
import type { ProgramStage } from './workouts';
import { SPLIT_DAY_LABEL, suggestedSplitDay } from './workouts';

export type SessionPick =
  | { routine: 'main'; kind: 'split'; splitDay: SplitDay }
  | { routine: 'main'; kind: 'full' }
  | { routine: 'main'; kind: 'beginner' }
  | { routine: Exclude<WorkoutRoutine, 'main'> };

export interface SessionPickRow {
  id: string;
  label: string;
  sub: string;
  pick: SessionPick;
}

function splitSub(day: SplitDay, lastSplitDay?: SplitDay): string {
  const hint = day === 'upper' ? 'Push · pull · core' : 'Legs · glutes · hang';
  const suggested = suggestedSplitDay(lastSplitDay);
  if (lastSplitDay && day === suggested) return `${hint} (suggested)`;
  return hint;
}

export function listSessionPicks(ctx: {
  mode: Mode;
  programStage: ProgramStage;
  lastSplitDay?: SplitDay;
  showGlutes: boolean;
}): SessionPickRow[] {
  const { mode, programStage, lastSplitDay, showGlutes } = ctx;
  const rows: SessionPickRow[] = [];

  if (programStage !== 'standard') {
    const week = programStage.toUpperCase();
    rows.push({
      id: 'main-beginner',
      label: `Main · Beginner (${week})`,
      sub: `Guided ramp — ${mode === 'home' ? 'Home' : 'Gym'} week ${week.slice(1)}`,
      pick: { routine: 'main', kind: 'beginner' },
    });
  } else {
    if (mode === 'gym') {
      rows.push({
        id: 'main-full',
        label: 'Main · Full',
        sub: 'Full body session',
        pick: { routine: 'main', kind: 'full' },
      });
    }
    rows.push(
      {
        id: 'main-upper',
        label: `Main · ${SPLIT_DAY_LABEL.upper}`,
        sub: splitSub('upper', lastSplitDay),
        pick: { routine: 'main', kind: 'split', splitDay: 'upper' },
      },
      {
        id: 'main-lower',
        label: `Main · ${SPLIT_DAY_LABEL.lower}`,
        sub: splitSub('lower', lastSplitDay),
        pick: { routine: 'main', kind: 'split', splitDay: 'lower' },
      },
    );
  }

  const extras: Exclude<WorkoutRoutine, 'main'>[] = showGlutes
    ? ['skills', 'glutes', 'mobility', 'conditioning']
    : ['skills', 'mobility', 'conditioning'];

  for (const id of extras) {
    const { title, sub } = ROUTINE_LABELS[id];
    rows.push({
      id,
      label: title,
      sub,
      pick: { routine: id },
    });
  }

  return rows;
}

export function applySessionPick(
  pick: SessionPick,
  setters: {
    setRoutine: (r: WorkoutRoutine) => void;
    setKind: (k: 'full' | 'split') => void;
    setChosenSplitDay: (d: SplitDay | undefined) => void;
  },
): { needsWarmup: boolean } {
  if (pick.routine === 'main') {
    setters.setRoutine('main');
    if (pick.kind === 'beginner') {
      setters.setKind('full');
      setters.setChosenSplitDay(undefined);
      return { needsWarmup: true };
    }
    if (pick.kind === 'full') {
      setters.setKind('full');
      setters.setChosenSplitDay(undefined);
      return { needsWarmup: true };
    }
    setters.setKind('split');
    setters.setChosenSplitDay(pick.splitDay);
    return { needsWarmup: true };
  }

  setters.setRoutine(pick.routine);
  setters.setKind('full');
  setters.setChosenSplitDay(undefined);

  if (pick.routine === 'mobility' || pick.routine === 'conditioning') {
    return { needsWarmup: false };
  }
  return { needsWarmup: true };
}
