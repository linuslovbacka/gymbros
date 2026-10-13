'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ExerciseGuide } from '@/components/ExerciseGuide';
import { getExercise } from '@/content/exercises';
import {
  ceilingPromptCopy,
  nextRungWorkoutItem,
  suggestedGymBumpKg,
  workingSetsHitCeiling,
} from '@/content/progressive-overload';
import { ROUTINE_LABELS, type WorkoutRoutine } from '@/content/routines';
import type { WorkoutItem } from '@/content/workouts';
import type { Mode, SplitDay } from '@/content/types';
import type { LoggedEntry } from '@/engine/types';
import {
  buildSupersetBlocks,
  roundsForBlock,
  type SupersetBlock,
} from '@/lib/workout-superset';
import { CooldownStep } from '@/components/CooldownStep';
import { LlPlayExerciseLog } from '@/components/LlPlayExerciseLog';
import { TimedSetInput } from '@/components/TimedSetInput';
import { cooldownVariantForMain } from '@/content/mobility';
import { llplayCardsEnter, llplayCardsExit } from '@/lib/nothing-motion';
import { useApp } from '@/state/store';
import { draftWithElapsedSec, type SessionDraft } from '@/screens/WorkoutScreen';

function offersMainCooldown(routine: WorkoutRoutine): boolean {
  return routine === 'main';
}

type VideoTab = 'a' | 'b';

export function SupersetLogPhase({
  items: initialItems,
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
  const [logItems, setLogItems] = useState<WorkoutItem[]>(() => initialItems);
  const blocks = useMemo(() => buildSupersetBlocks(logItems), [logItems]);
  const [blockIdx, setBlockIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [videoTab, setVideoTab] = useState<VideoTab>('a');
  /** Within a paired round: do A (e.g. pull-ups), then B (e.g. pike) — active rest, no idle timer. */
  const [pairStep, setPairStep] = useState<VideoTab>('a');

  const [values, setValues] = useState<number[][]>(() =>
    initialItems.map((it) => Array(it.sets).fill(it.timed ? 0 : it.low)),
  );
  const [weights, setWeights] = useState<number[][]>(() =>
    initialItems.map((it) => Array(it.sets).fill(it.weightKg ?? 0)),
  );
  const [accessoryWeight, setAccessoryWeight] = useState<boolean[]>(() => initialItems.map(() => false));
  const [ceilingDismissed, setCeilingDismissed] = useState<boolean[]>(() => initialItems.map(() => false));
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null);
  const [sessionStartedAt] = useState(() => Date.now());

  const block = blocks[blockIdx]!;
  const rounds = roundsForBlock(block, logItems);
  const isLastRound = roundIdx >= rounds - 1;
  const isLastBlock = blockIdx >= blocks.length - 1;

  const activeItemIndex = (): number => {
    if (block.type === 'solo') return block.index;
    const step = block.type === 'pair' ? pairStep : videoTab;
    return step === 'a' ? block.a : block.b;
  };

  const idx = activeItemIndex();
  const item = logItems[idx]!;
  const motionKey = `${blockIdx}-${roundIdx}-${pairStep}`;
  const cardRef = useRef<HTMLDivElement>(null);
  const cardBusyRef = useRef(false);

  useLayoutEffect(() => {
    if (!llplay) return;
    const card = cardRef.current;
    if (!card) return;
    cardBusyRef.current = true;
    void llplayCardsEnter([card]).then(() => {
      cardBusyRef.current = false;
    });
  }, [llplay, motionKey]);

  function swapThen(apply: () => void) {
    if (!llplay) {
      apply();
      return;
    }
    if (cardBusyRef.current) return;
    const card = cardRef.current;
    cardBusyRef.current = true;
    void llplayCardsExit(card ? [card] : []).then(apply);
  }

  function setVal(itemIndex: number, setNo: number, v: number) {
    setValues((prev) =>
      prev.map((row, i) =>
        i === itemIndex ? row.map((x, j) => (j === setNo ? Math.max(0, v) : x)) : row,
      ),
    );
  }

  function setWeight(itemIndex: number, setNo: number, v: number) {
    setWeights((prev) =>
      prev.map((row, i) =>
        i === itemIndex ? row.map((x, j) => (j === setNo ? Math.max(0, v) : x)) : row,
      ),
    );
  }

  function showWeightFor(itemIndex: number): boolean {
    const e = getExercise(logItems[itemIndex]!.exerciseId);
    return e.track === 'gym' || accessoryWeight[itemIndex];
  }

  function renderSetRow(itemIndex: number, setNo: number, label: string) {
    const it = logItems[itemIndex]!;
    if (setNo >= it.sets) return null;
    if (it.timed) {
      return (
        <TimedSetInput
          key={`${itemIndex}-${setNo}`}
          label={label}
          targetLow={it.low}
          targetHigh={it.high}
          value={values[itemIndex][setNo] ?? 0}
          onChange={(sec) => setVal(itemIndex, setNo, sec)}
        />
      );
    }
    return (
      <div className="superset-set-block" key={`${itemIndex}-${setNo}`}>
        <div className="superset-set-label">{label}</div>
        {showWeightFor(itemIndex) && (
          <div className="set-input">
            <button type="button" className="stepper" onClick={() => setWeight(itemIndex, setNo, (weights[itemIndex][setNo] ?? 0) - 2.5)}>-</button>
            <input
              type="number"
              inputMode="decimal"
              value={weights[itemIndex][setNo]}
              onChange={(e) => setWeight(itemIndex, setNo, Number(e.target.value))}
            />
            <span className="unit">kg</span>
            <button type="button" className="stepper" onClick={() => setWeight(itemIndex, setNo, (weights[itemIndex][setNo] ?? 0) + 2.5)}>+</button>
          </div>
        )}
        <div className="set-input">
          <button type="button" className="stepper" onClick={() => setVal(itemIndex, setNo, values[itemIndex][setNo] - 1)}>-</button>
          <input
            type="number"
            inputMode="numeric"
            value={values[itemIndex][setNo]}
            onChange={(e) => setVal(itemIndex, setNo, Number(e.target.value))}
          />
          <span className="unit">reps</span>
          <button type="button" className="stepper" onClick={() => setVal(itemIndex, setNo, values[itemIndex][setNo] + 1)}>+</button>
        </div>
      </div>
    );
  }

  function ceilingFor(itemIndex: number): boolean {
    const it = logItems[itemIndex]!;
    return workingSetsHitCeiling(values[itemIndex] ?? [], it.sets, it.high) && !ceilingDismissed[itemIndex];
  }

  function renderCeiling(itemIndex: number) {
    if (!ceilingFor(itemIndex)) return null;
    const it = logItems[itemIndex]!;
    const e = getExercise(it.exerciseId);
    const nextRung = e.track === 'calisthenics' ? nextRungWorkoutItem(it) : null;
    const { title, body } = ceilingPromptCopy(it, e.track);

    return (
      <div className="ceiling-prompt" role="status">
        <p className="ceiling-prompt-title">{title} — {it.name}</p>
        <p className="ceiling-prompt-body muted">{body}</p>
        <div className="ceiling-prompt-actions">
          {e.track === 'gym' ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                const bumped = suggestedGymBumpKg(it.exerciseId, weights[itemIndex]?.[0] ?? it.weightKg ?? 0);
                setWeights((prev) => prev.map((row, i) => (i === itemIndex ? row.map(() => bumped) : row)));
                setCeilingDismissed((prev) => prev.map((d, i) => (i === itemIndex ? true : d)));
              }}
            >
              Add weight for next sets
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setAccessoryWeight((prev) => prev.map((on, i) => (i === itemIndex ? true : on)));
                  setCeilingDismissed((prev) => prev.map((d, i) => (i === itemIndex ? true : d)));
                }}
              >
                Log extra load (kg)
              </button>
              {nextRung && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    climbExercise(it.exerciseId);
                    setLogItems((prev) => prev.map((row, i) => (i === itemIndex ? nextRung : row)));
                    setCeilingDismissed((prev) => prev.map((d, i) => (i === itemIndex ? true : d)));
                  }}
                >
                  Try: {nextRung.rungName}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => setCeilingDismissed((prev) => prev.map((d, i) => (i === itemIndex ? true : d)))}
          >
            Stay here
          </button>
        </div>
      </div>
    );
  }

  function advance() {
    if (block.type === 'pair' && pairStep === 'a') {
      swapThen(() => {
        setPairStep('b');
        setVideoTab('b');
      });
      return;
    }

    if (!isLastRound) {
      swapThen(() => {
        setPairStep('a');
        setVideoTab('a');
        setRoundIdx(roundIdx + 1);
      });
      return;
    }
    if (!isLastBlock) {
      swapThen(() => {
        setPairStep('a');
        setVideoTab('a');
        setBlockIdx(blockIdx + 1);
        setRoundIdx(0);
      });
      return;
    }
    finish();
  }

  const goBack = useCallback(() => {
    if (block.type === 'pair' && pairStep === 'b') {
      swapThen(() => {
        setPairStep('a');
        setVideoTab('a');
      });
      return;
    }
    if (roundIdx > 0) {
      swapThen(() => {
        setRoundIdx(roundIdx - 1);
        if (block.type === 'pair') {
          setPairStep('b');
          setVideoTab('b');
        }
      });
      return;
    }
    if (blockIdx > 0) {
      swapThen(() => {
        const prevBlock = blocks[blockIdx - 1]!;
        setBlockIdx(blockIdx - 1);
        const prevRounds = roundsForBlock(prevBlock, logItems);
        setRoundIdx(prevRounds - 1);
        if (prevBlock.type === 'pair') {
          setPairStep('b');
          setVideoTab('b');
        } else {
          setPairStep('a');
          setVideoTab('a');
        }
      });
      return;
    }
    onBack();
  }, [block.type, blockIdx, blocks, logItems, llplay, onBack, pairStep, roundIdx]);

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
      flow: 'superset',
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

  useEffect(() => {
    if (!llplay || !onRegisterShellBack) return;
    onRegisterShellBack(goBack);
  }, [llplay, onRegisterShellBack, goBack]);

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
    const pair = block.type === 'pair';
    const otherName = pair ? logItems[pairStep === 'a' ? block.b : block.a]!.name : null;
    const nextLabel =
      pair && pairStep === 'a'
        ? `Next: ${logItems[block.b]!.name}`
        : isLastBlock && isLastRound
          ? 'Finish workout'
          : isLastRound
            ? 'Next pairing'
            : 'Next round';
    return (
      <LlPlayExerciseLog
        key={`${item.exerciseId}-${idx}-${roundIdx}-${pairStep}`}
        screenRef={screenRef}
        motionRef={cardRef}
        onBack={goBack}
        kicker={isJump ? 'Warmup' : `Rep ${roundIdx + 1}/${rounds}`}
        title={
          isJump
            ? 'Jumping rope'
            : pair
              ? `${logItems[block.a]!.name} VS ${logItems[block.b]!.name}`
              : item.name
        }
        hint={
          pair
            ? 'Do move A, then move B — that’s your “rest.” \nNo timer between rounds.'
            : undefined
        }
        exerciseId={item.exerciseId}
        rungName={item.rungName}
        jumpRope={isJump}
        timed={isTimed && !pair}
        jumpAllocatedSec={item.high}
        onJumpComplete={() => {
          setVal(idx, 0, item.high);
          advance();
        }}
        onTimedComplete={() => {
          setVal(idx, item.timed ? roundIdx : 0, item.high);
          advance();
        }}
        reps={
          isTimed && !pair
            ? undefined
            : {
                current: values[idx]?.[roundIdx] ?? 0,
                target: item.high,
                onDec: () => setVal(idx, roundIdx, (values[idx]?.[roundIdx] ?? 0) - 1),
                onInc: () => setVal(idx, roundIdx, (values[idx]?.[roundIdx] ?? 0) + 1),
              }
        }
        nextLabel={otherName && pair && pairStep === 'a' ? `Next: ${otherName}` : nextLabel}
        onNext={advance}
        ceiling={isJump ? null : renderCeiling(idx)}
        onRegisterPrimary={onRegisterShellEnter}
        primaryBusy={cardBusyRef}
        sessionStartedAt={sessionStartedAt}
      />
    );
  }

  const sessionTitle = ROUTINE_LABELS[routine].title;
  const blockLabel =
    block.type === 'solo'
      ? logItems[block.index]!.name
      : `${logItems[block.a]!.name} ↔ ${logItems[block.b]!.name}`;

  const logInner = (
    <>
      {llplay ? (
        <p className="llplay-workout-log-title">{sessionTitle} · superset</p>
      ) : (
        <div className="topbar">
          <button type="button" className="back" onClick={goBack}>
            ← Back
          </button>
          <span className="tiny">{sessionTitle} · superset</span>
          <span style={{ width: 48 }} />
        </div>
      )}

      <p className="superset-round-label">
        Round {roundIdx + 1}/{rounds} · {blockLabel}
      </p>
      <p className="superset-hint muted">
        {block.type === 'pair'
          ? 'Do move A, then move B — that’s your “rest.” No timer between rounds.'
          : 'Log each set, then continue.'}
      </p>

      {block.type === 'pair' && (
        <div className="video-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={videoTab === 'a'}
            className={`video-tab${videoTab === 'a' ? ' active' : ''}`}
            onClick={() => {
              setVideoTab('a');
              setPairStep('a');
            }}
          >
            {logItems[block.a]!.name}
            {pairStep === 'a' ? ' · now' : ''}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={videoTab === 'b'}
            className={`video-tab${videoTab === 'b' ? ' active' : ''}`}
            onClick={() => {
              setVideoTab('b');
              setPairStep('b');
            }}
          >
            {logItems[block.b]!.name}
            {pairStep === 'b' ? ' · now' : ''}
          </button>
        </div>
      )}

      <div className="exercise-card" ref={cardRef}>
        <ExerciseGuide
          key={`${item.exerciseId}-${roundIdx}-${pairStep}`}
          exerciseId={item.exerciseId}
          rungName={item.rungName}
        />
        <h2 className="exercise-name">{item.name}</h2>
        <div className="exercise-rung">{item.rungName}</div>
      </div>

      <div className="superset-sets">
        {block.type === 'solo' && renderSetRow(block.index, roundIdx, `Set ${roundIdx + 1}`)}
        {block.type === 'pair' &&
          renderSetRow(
            pairStep === 'a' ? block.a : block.b,
            roundIdx,
            `${logItems[pairStep === 'a' ? block.a : block.b]!.name} — set ${roundIdx + 1}`,
          )}
      </div>

      {block.type === 'solo' && renderCeiling(block.index)}
      {block.type === 'pair' && renderCeiling(pairStep === 'a' ? block.a : block.b)}

      <button type="button" className="btn btn-primary btn-block" onClick={advance}>
        {block.type === 'pair' && pairStep === 'a'
          ? `Next: ${logItems[block.b]!.name}`
          : isLastBlock && isLastRound
            ? 'Finish workout'
            : isLastRound
              ? 'Next pairing'
              : 'Next round'}
      </button>
    </>
  );

  if (llplay) {
    return (
      <div className="auth-llplay__screen-inner llplay-workout llplay-workout--log" ref={screenRef}>
        <div className="llplay-workout-log superset-log">{logInner}</div>
      </div>
    );
  }

  return <div className="screen superset-log">{logInner}</div>;
}
