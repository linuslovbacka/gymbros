'use client';

import { useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { ExerciseGuide } from '../components/ExerciseGuide';
import { getExercise } from '../content/exercises';
import {
  buildRoutineWorkout,
  ROUTINE_LABELS,
  type WorkoutRoutine,
} from '../content/routines';
import { nextSplitDirection, type WorkoutItem } from '../content/workouts';
import type { Direction, Mode } from '../content/types';
import type { LoggedEntry } from '../engine/types';
import { canShowGluteRoutine } from '@/lib/personal-routines';

export interface SessionDraft {
  routine: WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  splitDirection?: Direction;
  entries: LoggedEntry[];
}

type Phase = 'routine' | 'mode' | 'homekind' | 'log';

function parseInitialRoutine(raw: string | null | undefined, showGlutes: boolean): WorkoutRoutine | null {
  if (raw === 'main' || raw === 'skills') return raw;
  if (raw === 'glutes' && showGlutes) return 'glutes';
  return null;
}

export function WorkoutScreen({
  onFinish,
  onCancel,
  initialRoutineParam,
}: {
  onFinish: (d: SessionDraft) => void;
  onCancel: () => void;
  /** From `/workout?routine=skills` */
  initialRoutineParam?: string | null;
}) {
  const { user, profile, lastSplitDirection } = useApp();
  const showGlutes = canShowGluteRoutine(user?.id);

  const preset = parseInitialRoutine(initialRoutineParam, showGlutes);

  const [routine, setRoutine] = useState<WorkoutRoutine>(preset ?? 'main');
  const [phase, setPhase] = useState<Phase>(preset ? 'mode' : 'routine');
  const [mode, setMode] = useState<Mode>('home');
  const [kind, setKind] = useState<'full' | 'split'>('full');

  const splitDirection = useMemo(() => nextSplitDirection(lastSplitDirection), [lastSplitDirection]);

  const items = useMemo<WorkoutItem[]>(() => {
    if (!profile || phase !== 'log') return [];
    return buildRoutineWorkout(routine, {
      mode,
      stage: profile.program_stage,
      state: profile.exercise_state,
      kind,
      splitDirection,
    });
  }, [profile, phase, routine, mode, kind, splitDirection]);

  if (!profile) return null;

  if (phase === 'routine') {
    const options: WorkoutRoutine[] = showGlutes ? ['main', 'skills', 'glutes'] : ['main', 'skills'];
    return (
      <div className="screen">
        <Topbar onBack={onCancel} title="What today?" />
        <div className="choice">
          {options.map((id) => {
            const { title, sub } = ROUTINE_LABELS[id];
            return (
              <ChoiceBtn
                key={id}
                label={title}
                sub={sub}
                onClick={() => {
                  setRoutine(id);
                  setPhase('mode');
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (phase === 'mode') {
    return (
      <div className="screen">
        <Topbar onBack={() => (preset ? onCancel() : setPhase('routine'))} title="Where are you?" />
        <div className="choice">
          <ChoiceBtn
            label="Home"
            sub="Rings, parallettes, vest, DB/KB"
            onClick={() => {
              setMode('home');
              const beginner = profile.program_stage !== 'standard';
              if (routine === 'main' && beginner) {
                setKind('full');
                setPhase('log');
              } else if (routine === 'main') {
                setPhase('homekind');
              } else {
                setPhase('log');
              }
            }}
          />
          <ChoiceBtn
            label="Gym"
            sub="Weights and machines"
            onClick={() => {
              setMode('gym');
              setKind('full');
              setPhase('log');
            }}
          />
        </div>
      </div>
    );
  }

  if (phase === 'homekind') {
    const isBeginner = profile.program_stage !== 'standard';
    return (
      <div className="screen">
        <Topbar onBack={() => setPhase('mode')} title="How much today?" />
        <div className="choice">
          <ChoiceBtn
            label="Full workout"
            sub={isBeginner ? `Beginner program · ${profile.program_stage.toUpperCase()}` : 'Every direction, ~20 min'}
            onClick={() => {
              setKind('full');
              setPhase('log');
            }}
          />
          {!isBeginner && (
            <ChoiceBtn
              label="Split"
              sub={`Next up: ${splitDirection.toUpperCase()}`}
              onClick={() => {
                setKind('split');
                setPhase('log');
              }}
            />
          )}
        </div>
      </div>
    );
  }

  const logBack = () => {
    if (routine === 'main' && mode === 'home') setPhase('homekind');
    else setPhase('mode');
  };

  return (
    <LogPhase
      items={items}
      routine={routine}
      mode={mode}
      kind={kind}
      splitDirection={splitDirection}
      onBack={logBack}
      onFinish={onFinish}
    />
  );
}

function LogPhase({
  items,
  routine,
  mode,
  kind,
  splitDirection,
  onBack,
  onFinish,
}: {
  items: WorkoutItem[];
  routine: WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  splitDirection: Direction;
  onBack: () => void;
  onFinish: (d: SessionDraft) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<number[][]>(() => items.map((it) => Array(it.sets).fill(it.low)));
  const [weights, setWeights] = useState<number[][]>(() =>
    items.map((it) => Array(it.sets).fill(it.weightKg ?? 0)),
  );

  const item = items[idx];
  const ex = getExercise(item.exerciseId);
  const isLast = idx === items.length - 1;

  function setVal(s: number, v: number) {
    setValues((prev) => prev.map((row, i) => (i === idx ? row.map((x, j) => (j === s ? Math.max(0, v) : x)) : row)));
  }
  function setWeight(s: number, v: number) {
    setWeights((prev) => prev.map((row, i) => (i === idx ? row.map((x, j) => (j === s ? Math.max(0, v) : x)) : row)));
  }

  function finish() {
    const entries: LoggedEntry[] = items.map((it, i) => {
      const e = getExercise(it.exerciseId);
      const mult = e.track === 'gym' ? 0 : e.ladder[it.rungIndex]?.ironMultiplier ?? 1;
      return {
        exerciseId: it.exerciseId,
        track: e.track,
        rungIndex: it.rungIndex,
        weightKg: it.weightKg,
        timed: it.timed,
        perSide: it.perSide,
        ironMultiplier: mult,
        target: { low: it.low, high: it.high, sets: it.sets },
        sets: values[i].map((v, j) => ({ value: v, weightKg: e.track === 'gym' ? weights[i][j] : undefined })),
      };
    });
    onFinish({
      routine,
      mode,
      kind,
      splitDirection: kind === 'split' ? splitDirection : undefined,
      entries,
    });
  }

  const unit = item.timed ? 'sec' : 'reps';
  const sessionTitle = ROUTINE_LABELS[routine].title;

  return (
    <div className="screen">
      <Topbar onBack={idx === 0 ? onBack : () => setIdx(idx - 1)} title={`${sessionTitle} · ${idx + 1}/${items.length}`} />

      <div className="progress-dots">
        {items.map((_, i) => (
          <span key={i} className={`d ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`} />
        ))}
      </div>

      <div className="exercise-card">
        <ExerciseGuide exerciseId={item.exerciseId} rungName={item.rungName} />
        <h2 className="exercise-name">{item.name}</h2>
        <div className="exercise-rung">{item.rungName}</div>
        <div className="exercise-prescription">
          Target: {item.prescription}{item.perSide ? ' (per side)' : ''}
        </div>

        <div className="set-list">
          {Array.from({ length: item.sets }).map((_, s) => (
            <div className="set-row" key={s}>
              <span className="set-no">Set {s + 1}</span>
              {ex.track === 'gym' && (
                <div className="set-input">
                  <button type="button" className="stepper" onClick={() => setWeight(s, (weights[idx][s] ?? 0) - 2.5)}>-</button>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weights[idx][s]}
                    onChange={(e) => setWeight(s, Number(e.target.value))}
                  />
                  <span className="unit">kg</span>
                  <button type="button" className="stepper" onClick={() => setWeight(s, (weights[idx][s] ?? 0) + 2.5)}>+</button>
                </div>
              )}
              <div className="set-input">
                <button type="button" className="stepper" onClick={() => setVal(s, values[idx][s] - 1)}>-</button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={values[idx][s]}
                  onChange={(e) => setVal(s, Number(e.target.value))}
                />
                <span className="unit">{unit}</span>
                <button type="button" className="stepper" onClick={() => setVal(s, values[idx][s] + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn btn-primary btn-block" onClick={isLast ? finish : () => setIdx(idx + 1)}>
        {isLast ? 'Finish workout' : 'Next exercise'}
      </button>
    </div>
  );
}

function Topbar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="topbar">
      <button type="button" className="back" onClick={onBack}>← Back</button>
      <span className="tiny">{title}</span>
      <span style={{ width: 48 }} />
    </div>
  );
}

function ChoiceBtn({ label, sub, onClick, disabled }: { label: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className="choice-btn" onClick={onClick} disabled={disabled}>
      <span>{label}<br /><span className="sub">{sub}</span></span>
      <span style={{ color: 'var(--muted-2)' }}>›</span>
    </button>
  );
}
