'use client';

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CalorieLogPanel, CalorieLogSummary } from '@/components/CalorieLogPanel';
import { ProteinLogPanel, ProteinLogSummary } from '@/components/ProteinLogPanel';
import {
  CREATINE_GUIDE,
  kcalTargetKcal,
  NO_SUGAR_HABIT_HINT,
  proteinTargetG,
  SLEEP_TARGET_LABEL,
  STEPS_TARGET_LABEL,
  WATER_TARGET_LABEL,
} from '@/content/diet';
import { MOBILITY_HABIT_LABEL } from '@/content/mobility';
import { habitScore } from '@/lib/habits-score';
import { useApp } from '@/state/store';
import type { HabitsToday, Profile } from '@/state/types';
import {
  llplayCardsEnter,
  NOTHING_DURATION_MED,
  NOTHING_EASE,
  nothingPop,
  nothingTap,
  prefersReducedMotion,
} from '@/lib/nothing-motion';

const TODAY = () => new Date().toISOString().slice(0, 10);

function trainingDone(profile: Profile | null): boolean {
  return profile?.streak_last_date === TODAY();
}

const emptyHabits: HabitsToday = {
  no_sugar: false,
  protein_met: false,
  protein_g: 0,
  calories_met: false,
  calories_kcal: 0,
  water_met: false,
  steps_met: false,
  sleep_met: false,
  creatine_met: false,
  mobility_met: false,
  sick: false,
};

interface CheckProps {
  label: string;
  sub?: string;
  done: boolean;
  onToggle?: () => void;
  /** Opens workout (same as TRAIN); does not toggle the checkmark. */
  onPress?: () => void;
  readOnly?: boolean;
  /** D-pad navigates between cards with this attribute (LL PLAY home). */
  llplayCard?: boolean;
}

const LLPLAY_HABIT_ORDER = [
  'protein',
  'calories',
  'sleep',
  'training',
  'steps',
  'no_sugar',
  'creatine',
  'mobility',
  'water',
] as const;

function sortLlplayHabitRows<T extends { id: string; done: boolean }>(
  rows: T[],
  sickRow: T,
): T[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = LLPLAY_HABIT_ORDER.map((id) => byId.get(id)).filter(Boolean) as T[];
  const open = ordered.filter((r) => !r.done);
  const finished = ordered.filter((r) => r.done);
  return [...open, ...finished, sickRow];
}

function LlplaySickRow({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const rowRef = useRef<HTMLButtonElement>(null);

  function handleClick() {
    nothingTap(rowRef.current);
    onToggle();
  }

  return (
    <button
      ref={rowRef}
      type="button"
      className={`llplay-sick-row nothing-press llplay-card${active ? ' is-on' : ''}`}
      data-llplay-card
      aria-pressed={active}
      onClick={handleClick}
    >
      Sick today
    </button>
  );
}

function CheckRow({ label, sub, done, onToggle, onPress, readOnly, llplayCard }: CheckProps) {
  const rowRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const pressable = Boolean(onToggle || onPress);
  const Tag = pressable ? 'button' : 'div';

  useEffect(() => {
    if (prefersReducedMotion() || !markRef.current) return;
    gsap.fromTo(
      markRef.current,
      { scale: 0.5, opacity: 0.4 },
      { scale: 1, opacity: 1, duration: NOTHING_DURATION_MED, ease: NOTHING_EASE },
    );
  }, [done]);

  function handleClick() {
    nothingTap(rowRef.current);
    if (onToggle) onToggle();
    else onPress?.();
  }

  if (llplayCard) {
    return (
      <Tag
        ref={rowRef as React.RefObject<HTMLButtonElement & HTMLDivElement>}
        type={Tag === 'button' ? 'button' : undefined}
        className={`daily-check daily-check--llplay-pill nothing-press ${done ? 'done' : ''}${readOnly && !onPress ? ' readonly' : ''}${onPress ? ' is-nav' : ''} llplay-card`}
        {...(pressable ? { 'data-llplay-card': true } : {})}
        onClick={pressable ? handleClick : undefined}
      >
        <span className="daily-check-llplay-main">
          <span className="daily-check-llplay-dot" ref={markRef} aria-hidden="true" data-done={done ? 'true' : 'false'} />
          <span className="daily-check-label">{label}</span>
        </span>
        {sub ? <span className="daily-check-sub">{sub}</span> : null}
      </Tag>
    );
  }

  return (
    <Tag
      ref={rowRef as React.RefObject<HTMLButtonElement & HTMLDivElement>}
      type={Tag === 'button' ? 'button' : undefined}
      className={`daily-check nothing-press ${done ? 'done' : ''}${readOnly && !onPress ? ' readonly' : ''}${onPress ? ' is-nav' : ''}`}
      onClick={pressable ? handleClick : undefined}
    >
      <span className="daily-check-mark" ref={markRef} aria-hidden="true">
        {done ? '✓' : '○'}
      </span>
      <span className="daily-check-label">{label}</span>
      {sub ? <span className="daily-check-sub muted">{sub}</span> : null}
    </Tag>
  );
}

export function DailyChecks({
  partnerProfile,
  onTrain,
  variant = 'default',
  containerRef,
}: {
  partnerProfile?: Profile | null;
  onTrain?: () => void;
  variant?: 'default' | 'llplay';
  containerRef?: RefObject<HTMLDivElement | null>;
}) {
  const isLlplay = variant === 'llplay';
  const {
    profile,
    habitsToday,
    partnerHabitsToday,
    toggleNoSugar,
    toggleWaterMet,
    toggleStepsMet,
    toggleSleepMet,
    toggleCreatineMet,
    toggleMobilityMet,
    toggleSickDay,
  } = useApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const prevScore = useRef<number | null>(null);

  useGSAP(
    () => {
      if (!rootRef.current) return;
      void llplayCardsEnter(rootRef.current.querySelectorAll('.daily-checks-stack > *'));
    },
    { scope: rootRef },
  );

  const mine = habitsToday ?? emptyHabits;
  const trained = profile ? trainingDone(profile) : false;
  const { done, total } = habitScore(mine, trained);

  useEffect(() => {
    if (prevScore.current === null) {
      prevScore.current = done;
      return;
    }
    if (prevScore.current !== done) {
      nothingPop(scoreRef.current);
      prevScore.current = done;
    }
  }, [done]);

  const bro = partnerProfile
    ? {
        habits: partnerHabitsToday ?? emptyHabits,
        trained: trainingDone(partnerProfile),
      }
    : null;

  const habitRows = useMemo(() => {
    if (!profile) return [];
    const rows: { id: string; done: boolean; node: React.ReactNode }[] = [
      {
        id: 'sleep',
        done: mine.sleep_met,
        node: (
          <CheckRow
            key="sleep"
            label="Sleep"
            sub={SLEEP_TARGET_LABEL}
            done={mine.sleep_met}
            llplayCard={isLlplay}
            onToggle={() => void toggleSleepMet()}
          />
        ),
      },
      {
        id: 'no_sugar',
        done: mine.no_sugar,
        node: (
          <CheckRow
            key="no_sugar"
            label="No Sugar"
            sub={NO_SUGAR_HABIT_HINT}
            done={mine.no_sugar}
            llplayCard={isLlplay}
            onToggle={() => void toggleNoSugar()}
          />
        ),
      },
      {
        id: 'protein',
        done: mine.protein_met,
        node: (
          <ProteinLogPanel
            key="protein"
            profile={profile}
            variant={isLlplay ? 'llplay' : 'home'}
          />
        ),
      },
      {
        id: 'calories',
        done: mine.calories_met,
        node: (
          <CalorieLogPanel
            key="calories"
            profile={profile}
            variant={isLlplay ? 'llplay' : 'home'}
          />
        ),
      },
      {
        id: 'water',
        done: mine.water_met,
        node: (
          <CheckRow
            key="water"
            label="Water"
            sub={WATER_TARGET_LABEL}
            done={mine.water_met}
            llplayCard={isLlplay}
            onToggle={() => void toggleWaterMet()}
          />
        ),
      },
      {
        id: 'steps',
        done: mine.steps_met,
        node: (
          <CheckRow
            key="steps"
            label="Steps"
            sub={STEPS_TARGET_LABEL}
            done={mine.steps_met}
            llplayCard={isLlplay}
            onToggle={() => void toggleStepsMet()}
          />
        ),
      },
      {
        id: 'creatine',
        done: mine.creatine_met,
        node: (
          <CheckRow
            key="creatine"
            label={isLlplay ? 'Creatine' : 'Kreatin'}
            sub={CREATINE_GUIDE.targetLabel}
            done={mine.creatine_met}
            llplayCard={isLlplay}
            onToggle={() => void toggleCreatineMet()}
          />
        ),
      },
      {
        id: 'mobility',
        done: mine.mobility_met,
        node: (
          <CheckRow
            key="mobility"
            label="Mobility"
            sub={MOBILITY_HABIT_LABEL}
            done={mine.mobility_met}
            llplayCard={isLlplay}
            onToggle={() => void toggleMobilityMet()}
          />
        ),
      },
      {
        id: 'training',
        done: mine.sick || trained,
        node: mine.sick ? (
          <CheckRow key="training" label="Training" sub="Rest day" done readOnly llplayCard={isLlplay} />
        ) : (
          <CheckRow
            key="training"
            label="Training"
            done={trained}
            readOnly
            llplayCard={isLlplay}
            onPress={onTrain}
          />
        ),
      },
    ];

    if (isLlplay) {
      const sickRow = {
        id: 'sick',
        done: mine.sick,
        node: <LlplaySickRow key="sick" active={mine.sick} onToggle={() => void toggleSickDay()} />,
      };
      return sortLlplayHabitRows(rows, sickRow);
    }

    return [...rows].sort((a, b) => Number(a.done) - Number(b.done));
  }, [
    mine.creatine_met,
    mine.mobility_met,
    mine.no_sugar,
    mine.protein_met,
    mine.calories_met,
    mine.sick,
    mine.sleep_met,
    mine.steps_met,
    mine.water_met,
    profile,
    trained,
    toggleCreatineMet,
    toggleMobilityMet,
    toggleNoSugar,
    toggleSickDay,
    toggleSleepMet,
    toggleStepsMet,
    toggleWaterMet,
    onTrain,
    isLlplay,
  ]);

  if (!profile) return null;

  function setChecksRef(el: HTMLDivElement | null) {
    rootRef.current = el;
    if (containerRef && 'current' in containerRef) {
      (containerRef as { current: HTMLDivElement | null }).current = el;
    }
  }

  return (
    <div className={`daily-checks${isLlplay ? ' is-llplay' : ''}`} ref={setChecksRef}>
      {!isLlplay && (
        <div className="daily-checks-head">
          <span className="daily-checks-title">Today</span>
          <span className="daily-checks-score" ref={scoreRef}>
            {done}/{total}
          </span>
        </div>
      )}

      {!isLlplay && (
        <button
          type="button"
          className={`btn sick-day-btn nothing-press${mine.sick ? ' sick-day-btn-on' : ''}`}
          onClick={() => void toggleSickDay()}
        >
          {mine.sick ? "I'm sick — rest day" : "I'm sick today (skip training)"}
        </button>
      )}

      <div className="daily-checks-stack">
        {habitRows.map((row) => (
          <div key={row.id} className="daily-checks-stack-item">
            {row.node}
          </div>
        ))}
      </div>

      {bro && (
        <div className="daily-checks-partner muted">
          <div className="tiny">Bro today</div>
          {bro.habits.sick && <div className="tiny sick-bro-note">Rest day (sick)</div>}
          <CheckRow label="Sleep" done={bro.habits.sleep_met} readOnly />
          <CheckRow label="No sugar" done={bro.habits.no_sugar} readOnly />
          <ProteinLogSummary
            logged={bro.habits.protein_g ?? 0}
            target={proteinTargetG(partnerProfile ?? undefined)}
            met={bro.habits.protein_met}
          />
          <CalorieLogSummary
            logged={bro.habits.calories_kcal ?? 0}
            target={kcalTargetKcal(partnerProfile ?? undefined)}
            met={bro.habits.calories_met}
          />
          <CheckRow label="Water" done={bro.habits.water_met} readOnly />
          <CheckRow label="Steps" done={bro.habits.steps_met} readOnly />
          <CheckRow label="Kreatin" done={bro.habits.creatine_met} readOnly />
          <CheckRow label="Mobility" done={bro.habits.mobility_met} readOnly />
          {bro.habits.sick ? (
            <CheckRow label="Training" sub="Rest" done readOnly />
          ) : (
            <CheckRow label="Training" done={bro.trained} readOnly />
          )}
        </div>
      )}
    </div>
  );
}
