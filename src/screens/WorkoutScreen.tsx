import { useMemo, useState } from 'react';
import { useApp } from '../state/store';
import { getExercise } from '../content/exercises';
import { buildWorkout, nextSplitDirection, type WorkoutItem } from '../content/workouts';
import type { Direction, Mode } from '../content/types';
import type { LoggedEntry } from '../engine/types';

export interface SessionDraft {
  mode: Mode;
  kind: 'full' | 'split';
  splitDirection?: Direction;
  entries: LoggedEntry[];
}

type Phase = 'mode' | 'homekind' | 'log';

export function WorkoutScreen({ onFinish, onCancel }: { onFinish: (d: SessionDraft) => void; onCancel: () => void }) {
  const { profile, lastSplitDirection } = useApp();
  const [phase, setPhase] = useState<Phase>('mode');
  const [mode, setMode] = useState<Mode>('home');
  const [kind, setKind] = useState<'full' | 'split'>('full');

  const splitDirection = useMemo(() => nextSplitDirection(lastSplitDirection), [lastSplitDirection]);

  const items = useMemo<WorkoutItem[]>(() => {
    if (!profile || phase !== 'log') return [];
    return buildWorkout({
      mode,
      stage: profile.program_stage,
      state: profile.exercise_state,
      kind,
      splitDirection,
    });
  }, [profile, phase, mode, kind, splitDirection]);

  if (!profile) return null;

  // ── Choice steps ──────────────────────────────────────────────────────
  if (phase === 'mode') {
    return (
      <div className="screen">
        <Topbar onBack={onCancel} title="Where are you?" />
        <div className="choice">
          <ChoiceBtn label="Home" sub="Rings, parallettes, bodyweight" onClick={() => { setMode('home'); setPhase('homekind'); }} />
          <ChoiceBtn label="Gym" sub="Weights and machines" onClick={() => { setMode('gym'); setKind('full'); setPhase('log'); }} />
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
            onClick={() => { setKind('full'); setPhase('log'); }}
          />
          <ChoiceBtn
            label="Split"
            sub={isBeginner ? 'Available after the beginner block' : `Next up: ${splitDirection.toUpperCase()}`}
            disabled={isBeginner}
            onClick={() => { setKind('split'); setPhase('log'); }}
          />
        </div>
      </div>
    );
  }

  return (
    <LogPhase
      items={items}
      mode={mode}
      kind={kind}
      splitDirection={splitDirection}
      onBack={() => setPhase(mode === 'gym' ? 'mode' : 'homekind')}
      onFinish={onFinish}
    />
  );
}

// ─── Logging phase: one exercise at a time ──────────────────────────────
function LogPhase({
  items, mode, kind, splitDirection, onBack, onFinish,
}: {
  items: WorkoutItem[];
  mode: Mode;
  kind: 'full' | 'split';
  splitDirection: Direction;
  onBack: () => void;
  onFinish: (d: SessionDraft) => void;
}) {
  const [idx, setIdx] = useState(0);
  // values[itemIndex][setIndex] = reps/seconds ; weights for gym lifts
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
    onFinish({ mode, kind, splitDirection: kind === 'split' ? splitDirection : undefined, entries });
  }

  const unit = item.timed ? 'sec' : 'reps';

  return (
    <div className="screen">
      <Topbar onBack={idx === 0 ? onBack : () => setIdx(idx - 1)} title={`${idx + 1} / ${items.length}`} />

      <div className="progress-dots">
        {items.map((_, i) => (
          <span key={i} className={`d ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`} />
        ))}
      </div>

      <div className="exercise-card">
        <div className="exercise-video">
          {ex.videoUrl ? 'video' : 'demo video — coming soon'}
        </div>
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
                  <button className="stepper" onClick={() => setWeight(s, (weights[idx][s] ?? 0) - 2.5)}>-</button>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weights[idx][s]}
                    onChange={(e) => setWeight(s, Number(e.target.value))}
                  />
                  <span className="unit">kg</span>
                  <button className="stepper" onClick={() => setWeight(s, (weights[idx][s] ?? 0) + 2.5)}>+</button>
                </div>
              )}
              <div className="set-input">
                <button className="stepper" onClick={() => setVal(s, values[idx][s] - 1)}>-</button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={values[idx][s]}
                  onChange={(e) => setVal(s, Number(e.target.value))}
                />
                <span className="unit">{unit}</span>
                <button className="stepper" onClick={() => setVal(s, values[idx][s] + 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={isLast ? finish : () => setIdx(idx + 1)}>
        {isLast ? 'Finish workout' : 'Next exercise'}
      </button>
    </div>
  );
}

// ─── Small shared bits ──────────────────────────────────────────────────
function Topbar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="topbar">
      <button className="back" onClick={onBack}>← Back</button>
      <span className="tiny">{title}</span>
      <span style={{ width: 48 }} />
    </div>
  );
}

function ChoiceBtn({ label, sub, onClick, disabled }: { label: string; sub: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button className="choice-btn" onClick={onClick} disabled={disabled}>
      <span>{label}<br /><span className="sub">{sub}</span></span>
      <span style={{ color: 'var(--muted-2)' }}>›</span>
    </button>
  );
}
