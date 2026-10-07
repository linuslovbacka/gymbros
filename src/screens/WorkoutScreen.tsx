'use client';

import { useMemo, useState } from 'react';
import { useApp } from '../state/store';
import {
  ceilingPromptCopy,
  nextRungWorkoutItem,
  suggestedGymBumpKg,
  workingSetsHitCeiling,
} from '../content/progressive-overload';
import { ExerciseGuide } from '../components/ExerciseGuide';
import { getExercise } from '../content/exercises';
import { JUMP_ROPE_WARMUP_GUIDE, NORWEGIAN_4X4_GUIDE } from '../content/conditioning';
import { MOBILITY_SESSION_INTRO, MOBILITY_STRETCH_GUIDE } from '../content/mobility';
import {
  buildJumpRopeWarmupItem,
  buildRoutineWorkout,
  ROUTINE_LABELS,
  strengthRoutine,
  type WorkoutRoutine,
} from '../content/routines';
import {
  BEGINNER_ONBOARDING,
  SPLIT_DAY_LABEL,
  splitDaySuggestion,
  suggestedSplitDay,
  type WorkoutItem,
} from '../content/workouts';
import { describeBeginnerWeek } from '../content/schedule';
import type { Mode, SplitDay } from '../content/types';
import type { LoggedEntry } from '../engine/types';
import { SupersetLogPhase } from '@/components/SupersetLogPhase';
import { SkipBeginnerSheet } from '@/components/SkipBeginnerSheet';
import { canShowGluteRoutine } from '@/lib/personal-routines';
import { useSupersetFlow } from '@/lib/workout-superset';

export interface SessionDraft {
  routine: WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  flow?: 'classic' | 'superset';
  splitDay?: SplitDay;
  entries: LoggedEntry[];
}

type Phase = 'routine' | 'mode' | 'beginnerBrief' | 'homekind' | 'warmup' | 'log';

function parseInitialRoutine(raw: string | null | undefined, showGlutes: boolean): WorkoutRoutine | null {
  if (raw === 'main' || raw === 'skills' || raw === 'conditioning' || raw === 'mobility') return raw;
  if (raw === 'glutes' && showGlutes) return 'glutes';
  return null;
}

function goToLogOrWarmup(
  routine: WorkoutRoutine,
  setPhase: (p: Phase) => void,
  profile: { program_stage: string },
  mode: Mode,
  setKind: (k: 'full' | 'split') => void,
) {
  if (routine === 'conditioning' || routine === 'mobility') {
    setPhase('log');
    return;
  }
  if (routine === 'main' && mode === 'home' && profile.program_stage !== 'standard') {
    setPhase('beginnerBrief');
    return;
  }
  if (strengthRoutine(routine)) {
    setPhase('warmup');
    return;
  }
  setPhase('log');
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
  const { user, profile, lastSplitDay, skipBeginnerProgram } = useApp();
  const showGlutes = canShowGluteRoutine(user?.id);

  const preset = parseInitialRoutine(initialRoutineParam, showGlutes);

  const [routine, setRoutine] = useState<WorkoutRoutine>(preset ?? 'main');
  const [phase, setPhase] = useState<Phase>(() => {
    if (preset === 'conditioning' || preset === 'mobility') return 'log';
    if (preset) return 'mode';
    return 'routine';
  });
  const [mode, setMode] = useState<Mode>('home');
  const [kind, setKind] = useState<'full' | 'split'>('full');
  const [chosenSplitDay, setChosenSplitDay] = useState<SplitDay | undefined>();
  const [includeJumpRope, setIncludeJumpRope] = useState(false);
  const [skipSheetOpen, setSkipSheetOpen] = useState(false);

  const sessionSplitDay = kind === 'split' ? chosenSplitDay : undefined;

  const items = useMemo<WorkoutItem[]>(() => {
    if (!profile || phase !== 'log') return [];
    const base = buildRoutineWorkout(routine, {
      mode,
      stage: profile.program_stage,
      state: profile.exercise_state,
      kind,
      splitDay: sessionSplitDay,
    });
    if (includeJumpRope && strengthRoutine(routine)) {
      return [buildJumpRopeWarmupItem(profile.exercise_state), ...base];
    }
    return base;
  }, [profile, phase, routine, mode, kind, sessionSplitDay, includeJumpRope]);

  if (!profile) return null;

  if (phase === 'routine') {
    const options: WorkoutRoutine[] = showGlutes
      ? ['main', 'skills', 'glutes', 'mobility', 'conditioning']
      : ['main', 'skills', 'mobility', 'conditioning'];
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
                  if (id === 'conditioning' || id === 'mobility') {
                    setMode('home');
                    setKind('full');
                    setPhase('log');
                  } else {
                    setPhase('mode');
                  }
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
              if (routine === 'main' && profile.program_stage !== 'standard') {
                setPhase('beginnerBrief');
              } else if (routine === 'main') {
                setPhase('homekind');
              } else {
                goToLogOrWarmup(routine, setPhase, profile, 'home', setKind);
              }
            }}
          />
          <ChoiceBtn
            label="Gym"
            sub="Weights and machines"
            onClick={() => {
              setMode('gym');
              if (routine === 'main' && profile.program_stage === 'standard') {
                setPhase('homekind');
              } else {
                setKind('full');
                goToLogOrWarmup(routine, setPhase, profile, 'gym', setKind);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (phase === 'beginnerBrief') {
    const stage = profile.program_stage;
    if (stage === 'standard') return null;
    const weekItems = describeBeginnerWeek(stage);
    return (
      <div className="screen">
        <Topbar onBack={() => setPhase('mode')} title={BEGINNER_ONBOARDING.title} />
        <p className="muted">{BEGINNER_ONBOARDING.bullets[0]}</p>
        <p className="muted tiny">{BEGINNER_ONBOARDING.bullets[1]}</p>
        <h3 className="section-title">
          Today · {stage.toUpperCase()}
          <span className="chip"> Beginner ramp</span>
        </h3>
        <ul className="schedule-list">
          {weekItems.map((it) => (
            <li key={it.exerciseId}>
              <strong>{it.name}</strong> — {it.prescription}
            </li>
          ))}
        </ul>
        <div className="choice">
          <ChoiceBtn
            label="Start workout"
            sub={`Fixed home Main · ${stage.toUpperCase()}`}
            onClick={() => {
              setKind('full');
              setPhase('warmup');
            }}
          />
          <ChoiceBtn
            label={BEGINNER_ONBOARDING.skipLabel}
            sub="Jump to upper/lower at home"
            onClick={() => setSkipSheetOpen(true)}
          />
        </div>
        <SkipBeginnerSheet
          open={skipSheetOpen}
          onClose={() => setSkipSheetOpen(false)}
          onConfirm={() => {
            skipBeginnerProgram();
            setPhase('homekind');
          }}
        />
      </div>
    );
  }

  if (phase === 'homekind') {
    const suggested = suggestedSplitDay(lastSplitDay);
    const splitSub = (day: SplitDay) => {
      const hint = day === 'upper' ? 'Push · pull · core' : 'Legs · glutes · hang';
      if (lastSplitDay && day === suggested) return `${hint} (suggested)`;
      return hint;
    };
    return (
      <div className="screen">
        <Topbar onBack={() => setPhase('mode')} title="How much today?" />
        <p className="muted tiny">{splitDaySuggestion(lastSplitDay)}</p>
        <div className="choice">
          {mode === 'gym' && (
            <ChoiceBtn
              label="Full workout"
              sub="Every direction, ~20 min"
              onClick={() => {
                setKind('full');
                setChosenSplitDay(undefined);
                setPhase('warmup');
              }}
            />
          )}
          <ChoiceBtn
            label={SPLIT_DAY_LABEL.upper}
            sub={splitSub('upper')}
            onClick={() => {
              setKind('split');
              setChosenSplitDay('upper');
              setPhase('warmup');
            }}
          />
          <ChoiceBtn
            label={SPLIT_DAY_LABEL.lower}
            sub={splitSub('lower')}
            onClick={() => {
              setKind('split');
              setChosenSplitDay('lower');
              setPhase('warmup');
            }}
          />
        </div>
      </div>
    );
  }

  if (phase === 'warmup') {
    const beginnerStage = profile.program_stage !== 'standard' ? profile.program_stage.toUpperCase() : null;
    return (
      <div className="screen">
        <Topbar
          onBack={() => {
            if (routine === 'main' && profile.program_stage === 'standard') {
              setPhase('homekind');
            } else if (routine === 'main' && mode === 'home' && profile.program_stage !== 'standard') {
              setPhase('beginnerBrief');
            } else {
              setPhase('mode');
            }
          }}
          title={beginnerStage ? `Warmup · Beginner ${beginnerStage}` : 'Warmup'}
        />
        <p className="warmup-intro muted">{JUMP_ROPE_WARMUP_GUIDE}</p>
        <div className="choice">
          <ChoiceBtn
            label="Jump rope ~5 min"
            sub="Easy pace before strength"
            onClick={() => {
              setIncludeJumpRope(true);
              setPhase('log');
            }}
          />
          <ChoiceBtn
            label="Skip warmup"
            sub="Go straight to the workout"
            onClick={() => {
              setIncludeJumpRope(false);
              setPhase('log');
            }}
          />
        </div>
      </div>
    );
  }

  const logBack = () => {
    if (routine === 'mobility' || routine === 'conditioning') {
      setPhase('routine');
      return;
    }
    if (strengthRoutine(routine)) setPhase('warmup');
    else if (routine === 'main' && profile.program_stage === 'standard') setPhase('homekind');
    else if (routine === 'main' && mode === 'home' && profile.program_stage !== 'standard') setPhase('beginnerBrief');
    else setPhase('mode');
  };

  const superset = useSupersetFlow({ mode, routine });
  const logSplitDay = sessionSplitDay ?? 'upper';

  if (superset) {
    return (
      <SupersetLogPhase
        items={items}
        routine={routine}
        mode={mode}
        kind={kind}
        splitDay={logSplitDay}
        onBack={logBack}
        onFinish={onFinish}
      />
    );
  }

  return (
    <LogPhase
      items={items}
      routine={routine}
      mode={mode}
      kind={kind}
      splitDay={logSplitDay}
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
  splitDay,
  onBack,
  onFinish,
}: {
  items: WorkoutItem[];
  routine: WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  splitDay: SplitDay;
  onBack: () => void;
  onFinish: (d: SessionDraft) => void;
}) {
  const { climbExercise } = useApp();
  const [logItems, setLogItems] = useState<WorkoutItem[]>(() => items);
  const [idx, setIdx] = useState(0);
  const [values, setValues] = useState<number[][]>(() => items.map((it) => Array(it.sets).fill(it.low)));
  const [weights, setWeights] = useState<number[][]>(() =>
    items.map((it) => Array(it.sets).fill(it.weightKg ?? 0)),
  );
  const [accessoryWeight, setAccessoryWeight] = useState<boolean[]>(() => items.map(() => false));
  const [ceilingDismissed, setCeilingDismissed] = useState<boolean[]>(() => items.map(() => false));

  const item = logItems[idx]!;
  const ex = getExercise(item.exerciseId);
  const isLast = idx === logItems.length - 1;
  const showWeight =
    ex.track === 'gym' || accessoryWeight[idx];
  const atCeiling = workingSetsHitCeiling(values[idx] ?? [], item.sets, item.high);
  const showCeilingPrompt = atCeiling && !ceilingDismissed[idx];
  const nextRung = ex.track === 'calisthenics' ? nextRungWorkoutItem(item) : null;
  const { title: ceilingTitle, body: ceilingBody } = ceilingPromptCopy(item, ex.track);

  function setVal(s: number, v: number) {
    setValues((prev) => prev.map((row, i) => (i === idx ? row.map((x, j) => (j === s ? Math.max(0, v) : x)) : row)));
  }
  function setWeight(s: number, v: number) {
    setWeights((prev) => prev.map((row, i) => (i === idx ? row.map((x, j) => (j === s ? Math.max(0, v) : x)) : row)));
  }

  function dismissCeilingPrompt() {
    setCeilingDismissed((prev) => prev.map((d, i) => (i === idx ? true : d)));
  }

  function enableAccessoryWeight() {
    setAccessoryWeight((prev) => prev.map((on, i) => (i === idx ? true : on)));
    dismissCeilingPrompt();
  }

  function applyHarderVariation() {
    if (!nextRung) return;
    climbExercise(item.exerciseId);
    setLogItems((prev) => prev.map((it, i) => (i === idx ? nextRung : it)));
    setValues((prev) =>
      prev.map((row, i) => (i === idx ? Array(nextRung.sets).fill(nextRung.low) : row)),
    );
    setWeights((prev) =>
      prev.map((row, i) => (i === idx ? Array(nextRung.sets).fill(nextRung.weightKg ?? 0) : row)),
    );
    dismissCeilingPrompt();
  }

  function bumpGymWeightNow() {
    const base = weights[idx]?.[0] ?? item.weightKg ?? 0;
    const bumped = suggestedGymBumpKg(item.exerciseId, base);
    setWeights((prev) => prev.map((row, i) => (i === idx ? row.map(() => bumped) : row)));
    dismissCeilingPrompt();
  }

  function finish() {
    const entries: LoggedEntry[] = logItems.map((it, i) => {
      const e = getExercise(it.exerciseId);
      const mult = e.track === 'gym' ? 0 : e.ladder[it.rungIndex]?.ironMultiplier ?? 1;
      const includeWeight = e.track === 'gym' || accessoryWeight[i];
      return {
        exerciseId: it.exerciseId,
        track: e.track,
        rungIndex: it.rungIndex,
        weightKg: it.weightKg,
        timed: it.timed,
        perSide: it.perSide,
        ironMultiplier: mult,
        target: { low: it.low, high: it.high, sets: it.sets },
        sets: values[i].map((v, j) => ({
          value: v,
          weightKg: includeWeight ? weights[i][j] : undefined,
        })),
      };
    });
    onFinish({
      routine,
      mode,
      kind,
      flow: 'classic',
      splitDay: kind === 'split' ? splitDay : undefined,
      entries,
    });
  }

  const unit = item.timed ? 'sec' : 'reps';
  const sessionTitle = ROUTINE_LABELS[routine].title;

  return (
    <div className="screen">
      <Topbar onBack={idx === 0 ? onBack : () => setIdx(idx - 1)} title={`${sessionTitle} · ${idx + 1}/${logItems.length}`} />

      <div className="progress-dots">
        {logItems.map((_, i) => (
          <span key={i} className={`d ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`} />
        ))}
      </div>

      {routine === 'conditioning' && idx === 0 && (
        <div className="conditioning-guide">
          <p className="conditioning-guide-title">{NORWEGIAN_4X4_GUIDE.title}</p>
          <p className="muted">{NORWEGIAN_4X4_GUIDE.intro}</p>
          <p className="muted">{NORWEGIAN_4X4_GUIDE.intervals}</p>
          <p className="muted tiny">{NORWEGIAN_4X4_GUIDE.when}</p>
        </div>
      )}

      {routine === 'mobility' && idx === 0 && (
        <div className="conditioning-guide">
          <p className="conditioning-guide-title">{MOBILITY_SESSION_INTRO.title}</p>
          <p className="muted">{MOBILITY_SESSION_INTRO.intro}</p>
          <p className="muted tiny">{MOBILITY_SESSION_INTRO.when}</p>
        </div>
      )}

      <div className="exercise-card">
        <ExerciseGuide exerciseId={item.exerciseId} rungName={item.rungName} />
        {item.exerciseId === 'norwegian_4x4' && (
          <p className="interval-recovery-note muted">
            After you log this interval, take ~3 minutes easy before the next set.
          </p>
        )}
        {MOBILITY_STRETCH_GUIDE[item.exerciseId] && (
          <p className="interval-recovery-note muted">
            {MOBILITY_STRETCH_GUIDE[item.exerciseId].cue}
          </p>
        )}
        <h2 className="exercise-name">{item.name}</h2>
        <div className="exercise-rung">{item.rungName}</div>
        <div className="exercise-prescription">
          Target: {item.prescription}{item.perSide ? ' (per side)' : ''}
        </div>

        {showCeilingPrompt && (
          <div className="ceiling-prompt" role="status">
            <p className="ceiling-prompt-title">{ceilingTitle}</p>
            <p className="ceiling-prompt-body muted">{ceilingBody}</p>
            <div className="ceiling-prompt-actions">
              {ex.track === 'gym' ? (
                <button type="button" className="btn btn-primary" onClick={bumpGymWeightNow}>
                  Add weight for next sets
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn-primary" onClick={enableAccessoryWeight}>
                    Log extra load (kg)
                  </button>
                  {nextRung && (
                    <button type="button" className="btn" onClick={applyHarderVariation}>
                      Try: {nextRung.rungName}
                    </button>
                  )}
                </>
              )}
              <button type="button" className="btn" onClick={dismissCeilingPrompt}>
                Stay here this session
              </button>
            </div>
          </div>
        )}

        <div className="set-list">
          {Array.from({ length: item.sets }).map((_, s) => (
            <div className="set-row" key={s}>
              <span className="set-no">Set {s + 1}</span>
              {showWeight && (
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
