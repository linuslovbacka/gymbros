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
  splitDaySuggestion,
  type WorkoutItem,
} from '../content/workouts';
import { describeBeginnerWeek } from '../content/schedule';
import { applySessionPick, listSessionPicks, type SessionPick } from '../content/train-menu';
import { cooldownVariantForMain } from '../content/mobility';
import type { Mode, SplitDay } from '../content/types';
import type { LoggedEntry } from '../engine/types';
import { CooldownStep } from '@/components/CooldownStep';
import { SupersetLogPhase } from '@/components/SupersetLogPhase';
import { SkipBeginnerSheet } from '@/components/SkipBeginnerSheet';
import { TimedSetInput } from '@/components/TimedSetInput';
import { canShowGluteRoutine } from '@/lib/personal-routines';
import { useSupersetFlow } from '@/lib/workout-superset';

export interface SessionDraft {
  routine: WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  flow?: 'classic' | 'superset';
  splitDay?: SplitDay;
  entries: LoggedEntry[];
  cooldownCompleted?: boolean;
}

function offersMainCooldown(routine: WorkoutRoutine): boolean {
  return routine === 'main';
}

type Phase = 'mode' | 'pick' | 'warmup' | 'log';

export function WorkoutScreen({
  onFinish,
  onCancel,
  initialRoutineParam,
}: {
  onFinish: (d: SessionDraft) => void;
  onCancel: () => void;
  /** Reserved for `/workout?routine=…` — user still picks Home/Gym first. */
  initialRoutineParam?: string | null;
}) {
  const { user, profile, lastSplitDay, skipBeginnerProgram } = useApp();
  const showGlutes = canShowGluteRoutine(user?.id);

  void initialRoutineParam;

  const [routine, setRoutine] = useState<WorkoutRoutine>('main');
  const [phase, setPhase] = useState<Phase>('mode');
  const [mode, setMode] = useState<Mode>('home');
  const [kind, setKind] = useState<'full' | 'split'>('full');
  const [chosenSplitDay, setChosenSplitDay] = useState<SplitDay | undefined>();
  const [includeJumpRope, setIncludeJumpRope] = useState(false);
  const [skipSheetOpen, setSkipSheetOpen] = useState(false);
  const [showBeginnerFullPlan, setShowBeginnerFullPlan] = useState(false);

  const sessionSplitDay = kind === 'split' ? chosenSplitDay : undefined;

  const sessionPicks = useMemo(() => {
    if (!profile || phase !== 'pick') return [];
    return listSessionPicks({
      mode,
      programStage: profile.program_stage,
      lastSplitDay,
      showGlutes,
    });
  }, [profile, phase, mode, lastSplitDay, showGlutes]);

  function startSession(pick: SessionPick) {
    setIncludeJumpRope(false);
    const { needsWarmup } = applySessionPick(pick, {
      setRoutine,
      setKind,
      setChosenSplitDay,
    });
    setPhase(needsWarmup ? 'warmup' : 'log');
  }

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

  if (phase === 'mode') {
    return (
      <div className="screen">
        <Topbar onBack={onCancel} title="Where are you?" />
        <div className="choice">
          <ChoiceBtn
            label="Home"
            sub="Rings, parallettes, vest, DB/KB"
            onClick={() => {
              setMode('home');
              setPhase('pick');
            }}
          />
          <ChoiceBtn
            label="Gym"
            sub="Weights and machines"
            onClick={() => {
              setMode('gym');
              setPhase('pick');
            }}
          />
        </div>
      </div>
    );
  }

  if (phase === 'pick') {
    const stage = profile.program_stage;
    const inBeginner = stage !== 'standard';
    const modeLabel = mode === 'home' ? 'Home' : 'Gym';

    return (
      <div className="screen">
        <Topbar onBack={() => setPhase('mode')} title="What today?" />
        <p className="muted tiny">
          {modeLabel}
          {inBeginner ? (
            <>
              {' · '}
              {BEGINNER_ONBOARDING.title}
            </>
          ) : (
            <> · {splitDaySuggestion(lastSplitDay)}</>
          )}
        </p>
        {inBeginner && (
          <p className="muted tiny">{BEGINNER_ONBOARDING.advanceDetail}</p>
        )}
        <div className="choice">
          {sessionPicks.map((row) => (
            <ChoiceBtn
              key={row.id}
              label={row.label}
              sub={row.sub}
              onClick={() => startSession(row.pick)}
            />
          ))}
        </div>
        {inBeginner && (
          <>
            <button
              type="button"
              className="btn"
              onClick={() => setShowBeginnerFullPlan((v) => !v)}
            >
              {showBeginnerFullPlan ? 'Hide full week plan' : 'Full week plan (W1–W3)'}
            </button>
            {showBeginnerFullPlan &&
              (['w1', 'w2', 'w3'] as const).map((week) => (
                <div key={week} className="schedule-block">
                  <h3 className="section-title">
                    Week {week.slice(1).toUpperCase()}
                    {stage === week && <span className="chip"> You are here</span>}
                  </h3>
                  <p className="muted">
                    <strong>Home</strong>
                  </p>
                  <ul className="schedule-list">
                    {describeBeginnerWeek(week, 'home').map((it) => (
                      <li key={`home-${it.exerciseId}`}>
                        <strong>{it.name}</strong> — {it.prescription}
                      </li>
                    ))}
                  </ul>
                  <p className="muted">
                    <strong>Gym</strong>
                  </p>
                  <ul className="schedule-list">
                    {describeBeginnerWeek(week, 'gym').map((it) => (
                      <li key={`gym-${it.exerciseId}`}>
                        <strong>{it.name}</strong> — {it.prescription}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            <div className="choice">
              <ChoiceBtn
                label={BEGINNER_ONBOARDING.skipLabel}
                sub="Same week counter — unlocks split/full choices"
                onClick={() => setSkipSheetOpen(true)}
              />
            </div>
            <SkipBeginnerSheet
              open={skipSheetOpen}
              onClose={() => setSkipSheetOpen(false)}
              onConfirm={() => {
                skipBeginnerProgram();
                setShowBeginnerFullPlan(false);
              }}
            />
          </>
        )}
      </div>
    );
  }

  if (phase === 'warmup') {
    const beginnerStage = profile.program_stage !== 'standard' ? profile.program_stage.toUpperCase() : null;
    return (
      <div className="screen">
        <Topbar
          onBack={() => setPhase('pick')}
          title={beginnerStage ? `Warmup · ${mode === 'home' ? 'Home' : 'Gym'} · ${beginnerStage}` : 'Warmup'}
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
      setPhase('pick');
      return;
    }
    if (strengthRoutine(routine)) setPhase('warmup');
    else setPhase('pick');
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
  const [values, setValues] = useState<number[][]>(() =>
    items.map((it) => Array(it.sets).fill(it.timed ? 0 : it.low)),
  );
  const [weights, setWeights] = useState<number[][]>(() =>
    items.map((it) => Array(it.sets).fill(it.weightKg ?? 0)),
  );
  const [accessoryWeight, setAccessoryWeight] = useState<boolean[]>(() => items.map(() => false));
  const [ceilingDismissed, setCeilingDismissed] = useState<boolean[]>(() => items.map(() => false));
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null);

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

  function buildDraft(): SessionDraft {
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
    return {
      routine,
      mode,
      kind,
      flow: 'classic',
      splitDay: kind === 'split' ? splitDay : undefined,
      entries,
    };
  }

  function finish() {
    const draft = buildDraft();
    if (offersMainCooldown(routine)) {
      setPendingDraft(draft);
      return;
    }
    onFinish(draft);
  }

  if (pendingDraft) {
    const variant = cooldownVariantForMain(pendingDraft.kind, splitDay);
    return (
      <CooldownStep
        variant={variant}
        onBack={() => setPendingDraft(null)}
        onSkip={() => onFinish(pendingDraft)}
        onComplete={() => onFinish({ ...pendingDraft, cooldownCompleted: true })}
      />
    );
  }

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
          {Array.from({ length: item.sets }).map((_, s) =>
            item.timed ? (
              <TimedSetInput
                key={s}
                label={`Set ${s + 1}`}
                targetLow={item.low}
                targetHigh={item.high}
                value={values[idx][s] ?? 0}
                onChange={(sec) => setVal(s, sec)}
              />
            ) : (
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
                  <span className="unit">reps</span>
                  <button type="button" className="stepper" onClick={() => setVal(s, values[idx][s] + 1)}>+</button>
                </div>
              </div>
            ),
          )}
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
