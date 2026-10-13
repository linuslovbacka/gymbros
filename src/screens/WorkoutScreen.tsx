'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import gsap from 'gsap';
import { GameBoyShell } from '@/components/GameBoyShell';
import { LlPlayRoot } from '@/components/LlPlayRoot';
import {
  LLPLAY_CARD_SELECTOR,
  useHomeGameBoyNavigation,
} from '@/hooks/useHomeGameBoyNavigation';
import { useLlplayVerticalRubberBand } from '@/hooks/useLlplayVerticalRubberBand';
import { MVP_MODE } from '@/lib/mvp';
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
import { LlPlayExerciseLog } from '@/components/LlPlayExerciseLog';
import { canShowGluteRoutine } from '@/lib/personal-routines';
import { gameBoyPress } from '@/lib/gameboy-motion';
import { llplayCardsEnter, llplayCardsExit, nothingTap } from '@/lib/nothing-motion';
import {
  applyWorkoutLogStatic,
  LCD_LOG_TWEEN_CLASS,
  playWorkoutLogEnter,
  playWorkoutLogExit,
  queryWorkoutChrome,
} from '@/lib/workout-log-motion';
import { useSupersetFlow } from '@/lib/workout-superset';

export interface SessionDraft {
  routine: WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  flow?: 'classic' | 'superset';
  splitDay?: SplitDay;
  entries: LoggedEntry[];
  cooldownCompleted?: boolean;
  /** Whole log session wall time (sec), frozen when the draft is finalized. */
  elapsedSec?: number;
}

export function draftWithElapsedSec(draft: SessionDraft, sessionStartedAt: number): SessionDraft {
  return {
    ...draft,
    elapsedSec: Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000)),
  };
}

function offersMainCooldown(routine: WorkoutRoutine): boolean {
  return routine === 'main';
}

type Phase = 'mode' | 'pick' | 'warmup' | 'log';

function llplayMotionCards(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const pills = Array.from(root.querySelectorAll<HTMLElement>('.llplay-choice-pill'));
  if (pills.length > 0) return pills;
  return Array.from(root.querySelectorAll<HTMLElement>('.exercise-card'));
}

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
  const router = useRouter();
  const { user, profile, lastSplitDay, skipBeginnerProgram, signOut } = useApp();
  const showGlutes = canShowGluteRoutine(user?.id);
  const isLlplay = MVP_MODE;

  void initialRoutineParam;

  const [routine, setRoutine] = useState<WorkoutRoutine>('main');
  const [phase, setPhase] = useState<Phase>('mode');
  const [mode, setMode] = useState<Mode>('home');
  const [kind, setKind] = useState<'full' | 'split'>('full');
  const [chosenSplitDay, setChosenSplitDay] = useState<SplitDay | undefined>();
  const [includeJumpRope, setIncludeJumpRope] = useState(false);
  const [skipSheetOpen, setSkipSheetOpen] = useState(false);
  const [showBeginnerFullPlan, setShowBeginnerFullPlan] = useState(false);

  const screenRef = useRef<HTMLDivElement>(null);
  const lcdRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const shellBackRef = useRef<() => void>(() => {});
  const busyRef = useRef(false);
  const pendingLogEnterRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [lcdLogLive, setLcdLogLive] = useState(false);
  const [lcdLogTween, setLcdLogTween] = useState(false);

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

  const goPhase = useCallback((next: Phase) => {
    if (!isLlplay) {
      setPhase(next);
      return;
    }
    if (busyRef.current) return;
    if (phaseRef.current === next) return;
    busyRef.current = true;

    const from = phaseRef.current;
    const lcd = lcdRef.current;
    const chrome = queryWorkoutChrome(deviceRef.current);

    if (from === 'log' && next !== 'log') {
      const finishLeave = () => {
        if (lcd) applyWorkoutLogStatic(lcd, chrome, screenRef.current, false);
        setLcdLogLive(false);
        setLcdLogTween(false);
        setPhase(next);
      };
      if (!lcd) {
        finishLeave();
        return;
      }
      setLcdLogTween(true);
      void playWorkoutLogExit({
        screen: lcd,
        chrome,
        logLayer: screenRef.current,
      }).then(finishLeave);
      return;
    }

    if (next === 'log') {
      pendingLogEnterRef.current = true;
      setLcdLogTween(true);
      lcd?.classList.add(LCD_LOG_TWEEN_CLASS);
      setPhase(next);
      return;
    }

    void llplayCardsExit(llplayMotionCards(screenRef.current)).then(() => {
      setPhase(next);
    });
  }, [isLlplay]);

  useLayoutEffect(() => {
    if (!isLlplay) return;
    if (phase === 'log') {
      const lcd = lcdRef.current;
      const chrome = queryWorkoutChrome(deviceRef.current);
      const logLayer = screenRef.current;
      if (pendingLogEnterRef.current || lcdLogTween) {
        pendingLogEnterRef.current = false;
        if (!lcd) {
          setLcdLogTween(false);
          setLcdLogLive(true);
          busyRef.current = false;
          return;
        }
        let cancelled = false;
        void playWorkoutLogEnter({ screen: lcd, chrome, logLayer }).then(() => {
          if (cancelled) return;
          setLcdLogTween(false);
          setLcdLogLive(true);
          busyRef.current = false;
        });
        return () => {
          cancelled = true;
        };
      }
      busyRef.current = false;
      return;
    }
    busyRef.current = true;
    void llplayCardsEnter(llplayMotionCards(screenRef.current)).then(() => {
      busyRef.current = false;
    });
  }, [isLlplay, phase, lcdLogTween]);

  function startSession(pick: SessionPick) {
    if (isLlplay && busyRef.current) return;
    setIncludeJumpRope(false);
    const { needsWarmup } = applySessionPick(pick, {
      setRoutine,
      setKind,
      setChosenSplitDay,
    });
    goPhase(needsWarmup ? 'warmup' : 'log');
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

  const logBack = useCallback(() => {
    if (routine === 'mobility' || routine === 'conditioning') {
      goPhase('pick');
      return;
    }
    if (strengthRoutine(routine)) goPhase('warmup');
    else goPhase('pick');
  }, [routine, goPhase]);

  useEffect(() => {
    if (!isLlplay) return;
    if (phase === 'mode') {
      shellBackRef.current = () => {
        if (busyRef.current) return;
        busyRef.current = true;
        void llplayCardsExit(llplayMotionCards(screenRef.current)).then(() => {
          busyRef.current = false;
          onCancel();
        });
      };
    } else if (phase === 'pick') {
      shellBackRef.current = () => goPhase('mode');
    } else if (phase === 'warmup') {
      shellBackRef.current = () => goPhase('pick');
    }
  }, [isLlplay, phase, onCancel, goPhase]);

  const registerShellBack = useCallback((fn: () => void) => {
    shellBackRef.current = fn;
  }, []);

  const shellEnterRef = useRef<(() => void) | null>(null);
  const registerShellEnter = useCallback((fn: () => void) => {
    shellEnterRef.current = fn;
  }, []);

  const handleShellBack = useCallback(() => {
    if (busyRef.current) return;
    shellBackRef.current();
  }, []);

  const getFocusables = useCallback(() => {
    const root = screenRef.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(LLPLAY_CARD_SELECTOR));
  }, []);

  const rubberBandEnabled = isLlplay && (phase === 'pick' || phase === 'warmup');
  useLlplayVerticalRubberBand(screenRef, scrollBodyRef, rubberBandEnabled);

  const { handlePad, handleEnter: navEnter, handleBack } = useHomeGameBoyNavigation({
    focusables: getFocusables,
    onBack: handleShellBack,
  });

  const handleEnter = useCallback(
    (el: HTMLButtonElement | null) => {
      if (phaseRef.current === 'log') {
        gameBoyPress(el);
        shellEnterRef.current?.();
        return;
      }
      navEnter(el);
    },
    [navEnter],
  );

  const choiceVariant = isLlplay ? 'llplay' : undefined;
  const superset = useSupersetFlow({ mode, routine });

  if (!profile) return null;

  let content: ReactNode;

  if (phase === 'mode') {
    const modeChoices = (
      <div className={isLlplay ? 'llplay-workout__choices' : 'choice'}>
        <ChoiceBtn
          variant={choiceVariant}
          label="Home"
          sub="Rings, parallettes, vest, DB/KB"
          onClick={() => {
            setMode('home');
            goPhase('pick');
          }}
        />
        <ChoiceBtn
          variant={choiceVariant}
          label="Gym"
          sub="Weights and machines"
          onClick={() => {
            setMode('gym');
            goPhase('pick');
          }}
        />
      </div>
    );

    content = isLlplay ? (
      <div className="auth-llplay__screen-inner llplay-workout" ref={screenRef}>
        <div className="llplay-workout__body llplay-workout__body--centered">
          <LlPlayWorkoutLogo />
          <div className="llplay-workout__center">{modeChoices}</div>
        </div>
      </div>
    ) : (
      <div className="screen">
        <Topbar onBack={onCancel} title="Where are you?" />
        {modeChoices}
      </div>
    );
  } else if (phase === 'pick') {
    const stage = profile.program_stage;
    const inBeginner = stage !== 'standard';
    const modeLabel = mode === 'home' ? 'Home' : 'Gym';

    const pickBody = (
      <>
        {isLlplay ? <LlPlayWorkoutLogo className="llplay-workout__logo" /> : null}
        {!isLlplay ? (
          <Topbar onBack={() => goPhase('mode')} title="What today?" />
        ) : null}
        <p className={isLlplay ? 'llplay-workout-meta' : 'muted tiny'}>
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
          <p className={isLlplay ? 'llplay-workout-meta' : 'muted tiny'}>{BEGINNER_ONBOARDING.advanceDetail}</p>
        )}
        <div className={isLlplay ? 'llplay-workout__choices' : 'choice'}>
          {sessionPicks.map((row) => (
            <ChoiceBtn
              key={row.id}
              variant={choiceVariant}
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
              className={isLlplay ? 'llplay-workout__btn-secondary' : 'btn'}
              onClick={() => setShowBeginnerFullPlan((v) => !v)}
            >
              {showBeginnerFullPlan ? 'Hide full week plan' : 'Full week plan (W1–W3)'}
            </button>
            {showBeginnerFullPlan &&
              (['w1', 'w2', 'w3'] as const).map((week) => (
                <div key={week} className={isLlplay ? 'llplay-workout-plan schedule-block' : 'schedule-block'}>
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
            <div className={isLlplay ? 'llplay-workout__choices' : 'choice'}>
              <ChoiceBtn
                variant={choiceVariant}
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
      </>
    );

    content = isLlplay ? (
      <div className="auth-llplay__screen-inner llplay-workout" ref={screenRef}>
        <div className="llplay-workout__scroll-body" ref={scrollBodyRef}>
          {pickBody}
        </div>
      </div>
    ) : (
      <div className="screen">{pickBody}</div>
    );
  } else if (phase === 'warmup') {
    const beginnerStage = profile.program_stage !== 'standard' ? profile.program_stage.toUpperCase() : null;
    const warmupTitle = beginnerStage
      ? `Warmup · ${mode === 'home' ? 'Home' : 'Gym'} · ${beginnerStage}`
      : 'Warmup';

    const warmupBody = (
      <>
        {isLlplay ? <LlPlayWorkoutLogo className="llplay-workout__logo" /> : null}
        {!isLlplay ? (
          <Topbar onBack={() => goPhase('pick')} title={warmupTitle} />
        ) : (
          <p className="llplay-workout-log-title">{warmupTitle}</p>
        )}
        <p className={isLlplay ? 'llplay-workout-intro' : 'warmup-intro muted'}>{JUMP_ROPE_WARMUP_GUIDE}</p>
        <div className={isLlplay ? 'llplay-workout__choices' : 'choice'}>
          <ChoiceBtn
            variant={choiceVariant}
            label="Jump rope ~5 min"
            sub="Easy pace before strength"
            onClick={() => {
              setIncludeJumpRope(true);
              goPhase('log');
            }}
          />
          <ChoiceBtn
            variant={choiceVariant}
            label="Skip warmup"
            sub="Go straight to the workout"
            onClick={() => {
              setIncludeJumpRope(false);
              goPhase('log');
            }}
          />
        </div>
      </>
    );

    content = isLlplay ? (
      <div className="auth-llplay__screen-inner llplay-workout" ref={screenRef}>
        <div className="llplay-workout__scroll-body" ref={scrollBodyRef}>
          {warmupBody}
        </div>
      </div>
    ) : (
      <div className="screen">{warmupBody}</div>
    );
  } else {
    const logSplitDay = sessionSplitDay ?? 'upper';
    const llplayLogProps = isLlplay
      ? {
          llplay: true as const,
          onRegisterShellBack: registerShellBack,
          onRegisterShellEnter: registerShellEnter,
          screenRef,
        }
      : {};

    content = superset ? (
      <SupersetLogPhase
        items={items}
        routine={routine}
        mode={mode}
        kind={kind}
        splitDay={logSplitDay}
        onBack={logBack}
        onFinish={onFinish}
        {...llplayLogProps}
      />
    ) : (
      <LogPhase
        items={items}
        routine={routine}
        mode={mode}
        kind={kind}
        splitDay={logSplitDay}
        onBack={logBack}
        onFinish={onFinish}
        {...llplayLogProps}
      />
    );
  }

  if (!isLlplay) return content;

  return (
    <LlPlayRoot>
      <GameBoyShell
        onPad={handlePad}
        onEnter={handleEnter}
        onBack={handleBack}
        onStart={() => {
          if (busyRef.current) return;
          router.push('/');
        }}
        onDetails={() => {
          if (busyRef.current) return;
          router.push('/details');
        }}
        sessionActive
        onLogout={() => void signOut()}
        logTween={lcdLogTween}
        logLive={lcdLogLive}
        screenRef={lcdRef}
        deviceRef={deviceRef}
      >
        {content}
      </GameBoyShell>
    </LlPlayRoot>
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
  llplay,
  onRegisterShellBack,
  onRegisterShellEnter,
  screenRef,
}: {
  items: WorkoutItem[];
  routine: WorkoutRoutine;
  mode: Mode;
  kind: 'full' | 'split';
  splitDay: SplitDay;
  onBack: () => void;
  onFinish: (d: SessionDraft) => void;
  llplay?: boolean;
  onRegisterShellBack?: (fn: () => void) => void;
  onRegisterShellEnter?: (fn: () => void) => void;
  screenRef?: RefObject<HTMLDivElement | null>;
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
  const [sessionStartedAt] = useState(() => Date.now());
  const [setCursor, setSetCursor] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardBusyRef = useRef(false);

  useLayoutEffect(() => {
    setSetCursor(0);
    if (!llplay) return;
    const card = cardRef.current;
    if (!card) return;
    if (idx === 0) {
      gsap.set(card, { autoAlpha: 1, y: 0 });
      cardBusyRef.current = false;
      return;
    }
    cardBusyRef.current = true;
    void llplayCardsEnter([card]).then(() => {
      cardBusyRef.current = false;
    });
  }, [llplay, idx]);

  const changeIdx = useCallback(
    (next: number) => {
      if (!llplay) {
        setIdx(next);
        return;
      }
      if (cardBusyRef.current) return;
      const card = cardRef.current;
      cardBusyRef.current = true;
      void llplayCardsExit(card ? [card] : []).then(() => {
        setIdx(next);
      });
    },
    [llplay],
  );

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
    onFinish(draftWithElapsedSec(draft, sessionStartedAt));
  }

  const sessionTitle = ROUTINE_LABELS[routine].title;
  const stepBack = useCallback(() => {
    if (idx === 0) onBack();
    else changeIdx(idx - 1);
  }, [idx, onBack, changeIdx]);

  useEffect(() => {
    if (!llplay || !onRegisterShellBack) return;
    onRegisterShellBack(stepBack);
  }, [llplay, onRegisterShellBack, stepBack]);

  if (pendingDraft) {
    const variant = cooldownVariantForMain(pendingDraft.kind, splitDay);
    return (
      <CooldownStep
        variant={variant}
        onBack={() => setPendingDraft(null)}
        onSkip={() => onFinish(draftWithElapsedSec(pendingDraft, sessionStartedAt))}
        onComplete={() =>
          onFinish(draftWithElapsedSec({ ...pendingDraft, cooldownCompleted: true }, sessionStartedAt))
        }
        screenRef={screenRef}
        onRegisterPrimary={onRegisterShellEnter}
        sessionStartedAt={sessionStartedAt}
      />
    );
  }

  if (llplay) {
    const isJump = item.exerciseId === 'jump_rope';
    const isTimed = isJump || item.timed;
    const lastSet = setCursor >= item.sets - 1;
    const nextName = !isLast ? logItems[idx + 1]!.name : null;
    const ceiling = showCeilingPrompt ? (
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
    ) : null;
    const completeTimed = () => {
      setVal(isJump ? 0 : setCursor, item.high);
      if (isJump || lastSet) {
        if (isLast) finish();
        else changeIdx(idx + 1);
        return;
      }
      setSetCursor((c) => c + 1);
    };

    return (
      <LlPlayExerciseLog
        key={`${item.exerciseId}-${idx}-${setCursor}`}
        screenRef={screenRef}
        motionRef={cardRef}
        onBack={stepBack}
        kicker={isJump ? 'Warmup' : `Rep ${setCursor + 1}/${item.sets}`}
        title={isJump ? 'Jumping rope' : item.name}
        exerciseId={item.exerciseId}
        rungName={item.rungName}
        jumpRope={isJump}
        timed={isTimed}
        jumpAllocatedSec={item.high}
        onJumpComplete={completeTimed}
        onTimedComplete={completeTimed}
        reps={
          isTimed
            ? undefined
            : {
                current: values[idx]?.[setCursor] ?? 0,
                target: item.high,
                onDec: () => setVal(setCursor, (values[idx]?.[setCursor] ?? 0) - 1),
                onInc: () => setVal(setCursor, (values[idx]?.[setCursor] ?? 0) + 1),
              }
        }
        nextLabel={isLast && lastSet ? 'Finish' : lastSet && nextName ? `Next: ${nextName}` : lastSet ? 'Next exercise' : 'Next set'}
        onNext={() => {
          if (cardBusyRef.current) return;
          if (!lastSet) {
            setSetCursor((c) => c + 1);
            return;
          }
          if (isLast) finish();
          else changeIdx(idx + 1);
        }}
        ceiling={ceiling}
        onRegisterPrimary={onRegisterShellEnter}
        primaryBusy={cardBusyRef}
        sessionStartedAt={sessionStartedAt}
      />
    );
  }

  const logTitle = `${sessionTitle} · ${idx + 1}/${logItems.length}`;

  const logInner = (
    <>
      {llplay ? (
        <p className="llplay-workout-log-title">{logTitle}</p>
      ) : (
        <Topbar onBack={stepBack} title={logTitle} />
      )}

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

      <div className="exercise-card" ref={cardRef}>
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

      <button type="button" className="btn btn-primary btn-block" onClick={isLast ? finish : () => changeIdx(idx + 1)}>
        {isLast ? 'Finish workout' : 'Next exercise'}
      </button>
    </>
  );

  if (llplay) {
    return (
      <div className="auth-llplay__screen-inner llplay-workout llplay-workout--log" ref={screenRef}>
        <div className="llplay-workout-log">{logInner}</div>
      </div>
    );
  }

  return <div className="screen">{logInner}</div>;
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

function LlPlayWorkoutLogo({ className = '' }: { className?: string }) {
  return (
    <Image
      src="/ui/login/logo-barbell.svg"
      alt=""
      width={79}
      height={79}
      className={`auth-llplay__logo ${className}`.trim()}
      priority
    />
  );
}

function ChoiceBtn({
  label,
  sub,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'llplay';
}) {
  if (variant === 'llplay') {
    return (
      <button
        type="button"
        className="llplay-choice-pill nothing-press llplay-card"
        data-llplay-card
        onClick={(e) => {
          nothingTap(e.currentTarget);
          onClick();
        }}
        disabled={disabled}
      >
        <span className="llplay-choice-pill__label">{label}</span>
        <span className="llplay-choice-pill__sub">{sub}</span>
      </button>
    );
  }

  return (
    <button type="button" className="choice-btn" onClick={onClick} disabled={disabled}>
      <span>
        {label}
        <br />
        <span className="sub">{sub}</span>
      </span>
      <span style={{ color: 'var(--muted-2)' }}>›</span>
    </button>
  );
}
