'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ProteinLogPanel, ProteinLogSummary } from '@/components/ProteinLogPanel';
import { proteinTargetG, WATER_TARGET_LABEL } from '@/content/diet';
import { habitScore } from '@/lib/habits-score';
import { useApp } from '@/state/store';
import type { HabitsToday, Profile } from '@/state/types';
import { nothingPop, nothingTap, NOTHING_DURATION_MED, NOTHING_EASE, prefersReducedMotion } from '@/lib/nothing-motion';

const TODAY = () => new Date().toISOString().slice(0, 10);

function trainingDone(profile: Profile | null): boolean {
  return profile?.streak_last_date === TODAY();
}

const STEPS_TARGET_LABEL = '~10,000 steps / day';

const emptyHabits: HabitsToday = {
  no_sugar: false,
  protein_met: false,
  protein_g: 0,
  water_met: false,
  steps_met: false,
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
      <span>
        <span className="daily-check-label">{label}</span>
        {sub && <span className="daily-check-sub muted">{sub}</span>}
      </span>
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
    toggleSickDay,
  } = useApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const prevScore = useRef<number | null>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !rootRef.current) return;
      gsap.from(rootRef.current.querySelectorAll('.daily-check, .protein-log--home'), {
        opacity: 0,
        y: 8,
        duration: NOTHING_DURATION_MED,
        stagger: 0.05,
        ease: NOTHING_EASE,
      });
    },
    { scope: rootRef },
  );

  if (!profile) return null;

  const mine = habitsToday ?? emptyHabits;
  const trained = trainingDone(profile);
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

      <CheckRow label="No sugar" done={mine.no_sugar} onToggle={() => void toggleNoSugar()} />
      <ProteinLogPanel profile={profile} variant="home" />
      <CheckRow
        label="Water"
        sub={WATER_TARGET_LABEL}
        done={mine.water_met}
        onToggle={() => void toggleWaterMet()}
      />
      <CheckRow
        label="Steps"
        sub={STEPS_TARGET_LABEL}
        done={mine.steps_met}
        onToggle={() => void toggleStepsMet()}
      />

      {mine.sick ? (
        <CheckRow label="Training" sub="Rest day — excused" done readOnly />
      ) : (
        <CheckRow label="Training" done={trained} readOnly />
      )}

      {bro && (
        <div className="daily-checks-partner muted">
          <div className="tiny">Bro today</div>
          {bro.habits.sick && <div className="tiny sick-bro-note">Rest day (sick)</div>}
          <CheckRow label="No sugar" done={bro.habits.no_sugar} readOnly />
          <ProteinLogSummary
            logged={bro.habits.protein_g ?? 0}
            target={proteinTargetG(partnerProfile ?? undefined)}
            met={bro.habits.protein_met}
          />
          <CheckRow label="Water" done={bro.habits.water_met} readOnly />
          <CheckRow label="Steps" done={bro.habits.steps_met} readOnly />
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
