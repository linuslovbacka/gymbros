'use client';

import { useMemo, useState } from 'react';
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
import { useApp } from '@/state/store';
import type { SessionDraft } from '@/screens/WorkoutScreen';

type VideoTab = 'a' | 'b';

export function SupersetLogPhase({
  items: initialItems,
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
  const [logItems, setLogItems] = useState<WorkoutItem[]>(() => initialItems);
  const blocks = useMemo(() => buildSupersetBlocks(logItems), [logItems]);
  const [blockIdx, setBlockIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [videoTab, setVideoTab] = useState<VideoTab>('a');
  /** Within a paired round: do A (e.g. pull-ups), then B (e.g. pike) — active rest, no idle timer. */
  const [pairStep, setPairStep] = useState<VideoTab>('a');

  const [values, setValues] = useState<number[][]>(() =>
    initialItems.map((it) => Array(it.sets).fill(it.low)),
  );
  const [weights, setWeights] = useState<number[][]>(() =>
    initialItems.map((it) => Array(it.sets).fill(it.weightKg ?? 0)),
  );
  const [accessoryWeight, setAccessoryWeight] = useState<boolean[]>(() => initialItems.map(() => false));
  const [ceilingDismissed, setCeilingDismissed] = useState<boolean[]>(() => initialItems.map(() => false));

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
    const u = it.timed ? 'sec' : 'reps';
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
          <span className="unit">{u}</span>
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
      setPairStep('b');
      setVideoTab('b');
      return;
    }

    setPairStep('a');
    setVideoTab('a');

    if (!isLastRound) {
      setRoundIdx(roundIdx + 1);
      return;
    }
    if (!isLastBlock) {
      setBlockIdx(blockIdx + 1);
      setRoundIdx(0);
      return;
    }
    finish();
  }

  function goBack() {
    if (block.type === 'pair' && pairStep === 'b') {
      setPairStep('a');
      setVideoTab('a');
      return;
    }
    if (roundIdx > 0) {
      setRoundIdx(roundIdx - 1);
      if (block.type === 'pair') {
        setPairStep('b');
        setVideoTab('b');
      }
      return;
    }
    if (blockIdx > 0) {
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
      return;
    }
    onBack();
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
      flow: 'superset',
      splitDay: kind === 'split' ? splitDay : undefined,
      entries,
    });
  }

  const sessionTitle = ROUTINE_LABELS[routine].title;
  const blockLabel =
    block.type === 'solo'
      ? logItems[block.index]!.name
      : `${logItems[block.a]!.name} ↔ ${logItems[block.b]!.name}`;

  return (
    <div className="screen superset-log">
      <div className="topbar">
        <button type="button" className="back" onClick={goBack}>← Back</button>
        <span className="tiny">{sessionTitle} · superset</span>
        <span style={{ width: 48 }} />
      </div>

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

      <div className="exercise-card">
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
    </div>
  );
}
