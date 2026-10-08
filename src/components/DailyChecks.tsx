'use client';

import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ProteinLogPanel, ProteinLogSummary } from '@/components/ProteinLogPanel';
import {
  CREATINE_GUIDE,
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
import { nothingPop, nothingTap, NOTHING_DURATION_MED, NOTHING_EASE, prefersReducedMotion } from '@/lib/nothing-motion';

const TODAY = () => new Date().toISOString().slice(0, 10);

function trainingDone(profile: Profile | null): boolean {
  return profile?.streak_last_date === TODAY();
}

const emptyHabits: HabitsToday = {
  no_sugar: false,
  protein_met: false,
  protein_g: 0,
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
  readOnly?: boolean;
}

function CheckRow({ label, sub, done, onToggle, readOnly }: CheckProps) {
  const rowRef = useRef<HTMLButtonElement | HTMLDivElement>(null);
  const markRef = useRef<HTMLSpanElement>(null);
  const Tag = readOnly || !onToggle ? 'div' : 'button';

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
    onToggle?.();
  }

  return (
    <Tag
      ref={rowRef as React.RefObject<HTMLButtonElement & HTMLDivElement>}
      type={Tag === 'button' ? 'button' : undefined}
      className={`daily-check nothing-press ${done ? 'done' : ''}${readOnly ? ' readonly' : ''}`}
      onClick={readOnly ? undefined : handleClick}
      disabled={readOnly}
    >
      <span className="daily-check-mark" ref={markRef} aria-hidden="true">
        {done ? '✓' : '○'}
      </span>
      <span className="daily-check-label">{label}</span>
      {sub ? <span className="daily-check-sub muted">{sub}</span> : null}
    </Tag>
  );
}

export function DailyChecks({ partnerProfile }: { partnerProfile?: Profile | null }) {
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
      if (prefersReducedMotion() || !rootRef.current) return;
      gsap.from(rootRef.current.querySelectorAll('.daily-checks-stack > *'), {
        opacity: 0,
        duration: NOTHING_DURATION_MED,
        stagger: 0.04,
        ease: NOTHING_EASE,
        clearProps: 'opacity',
      });
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
            label="No sugar"
            sub={NO_SUGAR_HABIT_HINT}
            done={mine.no_sugar}
            onToggle={() => void toggleNoSugar()}
          />
        ),
      },
      {
        id: 'protein',
        done: mine.protein_met,
        node: <ProteinLogPanel key="protein" profile={profile} variant="home" />,
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
            label="Kreatin"
            sub={CREATINE_GUIDE.targetLabel}
            done={mine.creatine_met}
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
            onToggle={() => void toggleMobilityMet()}
          />
        ),
      },
      {
        id: 'training',
        done: mine.sick || trained,
        node: mine.sick ? (
          <CheckRow key="training" label="Training" sub="Rest day" done readOnly />
        ) : (
          <CheckRow key="training" label="Training" done={trained} readOnly />
        ),
      },
    ];
    return [...rows].sort((a, b) => Number(a.done) - Number(b.done));
  }, [
    mine.creatine_met,
    mine.mobility_met,
    mine.no_sugar,
    mine.protein_met,
    mine.sick,
    mine.sleep_met,
    mine.steps_met,
    mine.water_met,
    profile,
    trained,
    toggleCreatineMet,
    toggleMobilityMet,
    toggleNoSugar,
    toggleSleepMet,
    toggleStepsMet,
    toggleWaterMet,
  ]);

  if (!profile) return null;

  return (
    <div className="daily-checks" ref={rootRef}>
      <div className="daily-checks-head">
        <span className="daily-checks-title">Today</span>
        <span className="daily-checks-score" ref={scoreRef}>
          {done}/{total}
        </span>
      </div>

      <button
        type="button"
        className={`btn sick-day-btn nothing-press${mine.sick ? ' sick-day-btn-on' : ''}`}
        onClick={() => void toggleSickDay()}
      >
        {mine.sick ? "I'm sick — rest day" : "I'm sick today (skip training)"}
      </button>

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
