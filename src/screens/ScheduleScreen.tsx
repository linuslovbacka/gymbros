'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApp } from '@/state/store';
import {
  describeBeginnerWeek,
  describeFullSession,
  describeSplitDay,
  nextSplitDay,
  SPLIT_DAY_ORDER,
  todayPreview,
} from '@/content/schedule';
import type { Mode } from '@/content/types';
import { SICK_DAY_SCHEDULE_NOTE } from '@/content/diet';
import { ROUTINE_LABELS } from '@/content/routines';
import { HabitTimeline, weekTimelineMap } from '@/components/HabitTimeline';
import { MobilityGuideSheet } from '@/components/MobilityGuideSheet';
import { ScheduleWeekStrip } from '@/components/ScheduleWeekStrip';
import { useHabitHistory } from '@/hooks/useHabitHistory';

export function ScheduleScreen() {
  const { user, profile, lastSplitDay, habitsToday } = useApp();
  const { days: historyDays, loading: historyLoading } = useHabitHistory(
    user?.id,
    profile,
    habitsToday,
    84,
  );
  const weekByDate = weekTimelineMap(historyDays);
  const sickToday = habitsToday?.sick ?? false;
  const [previewMode, setPreviewMode] = useState<Mode>('home');
  const [previewKind, setPreviewKind] = useState<'full' | 'split'>('full');
  const [mobilitySheetOpen, setMobilitySheetOpen] = useState(false);

  const stage = profile?.program_stage ?? 'w1';
  const state = profile?.exercise_state ?? {};

  const preview = useMemo(() => {
    if (!profile) return [];
    return todayPreview({
      mode: previewMode,
      kind: previewKind,
      stage: profile.program_stage,
      state: profile.exercise_state,
      lastSplitDay,
    });
  }, [profile, previewMode, previewKind, lastSplitDay]);

  if (!profile) return null;

  const isBeginner = profile.program_stage !== 'standard';

  return (
    <div className="screen">
      <div className="topbar">
        <Link className="back" href="/">
          Back
        </Link>
        <div className="topbar-title">Schedule</div>
      </div>

      <section className="stack">
        <h2 className="section-title">This week</h2>
        <ScheduleWeekStrip sickToday={sickToday} weekByDate={weekByDate} />
        {sickToday && <p className="muted schedule-sick-note">{SICK_DAY_SCHEDULE_NOTE}</p>}
      </section>

      <section className="stack">
        <h2 className="section-title">TRAIN options</h2>
        <p className="muted">
          <strong>Main</strong> — full or upper/lower split. <strong>{ROUTINE_LABELS.skills.title}</strong> —{' '}
          {ROUTINE_LABELS.skills.sub}. <strong>{ROUTINE_LABELS.mobility.title}</strong> — timed hips/hamstrings
          session. <strong>{ROUTINE_LABELS.conditioning.title}</strong> — hard cardio when you want it (not every
          split day).
        </p>
        <button type="button" className="btn" onClick={() => setMobilitySheetOpen(true)}>
          Mobility & cooldown guide
        </button>
        <Link className="btn btn-primary" href="/workout?routine=mobility">
          Start Mobility session
        </Link>
      </section>

      <section className="stack">
        <HabitTimeline days={historyDays} loading={historyLoading} title="Last 12 weeks" />
      </section>

      <section className="stack">
        <h2 className="section-title">Today&apos;s preview</h2>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${previewMode === 'home' ? 'btn-primary' : ''}`}
            onClick={() => setPreviewMode('home')}
          >
            Home
          </button>
          <button
            type="button"
            className={`btn ${previewMode === 'gym' ? 'btn-primary' : ''}`}
            onClick={() => setPreviewMode('gym')}
          >
            Gym
          </button>
          <button
            type="button"
            className={`btn ${previewKind === 'full' ? 'btn-primary' : ''}`}
            onClick={() => setPreviewKind('full')}
          >
            Full
          </button>
          <button
            type="button"
            className={`btn ${previewKind === 'split' ? 'btn-primary' : ''}`}
            onClick={() => setPreviewKind('split')}
            disabled={isBeginner && previewMode === 'home'}
          >
            Split
          </button>
        </div>
        <ul className="schedule-list">
          {preview.map((item) => (
            <li key={item.exerciseId}>
              <strong>{item.name}</strong> — {item.prescription}
              <span className="muted"> ({item.rungName})</span>
            </li>
          ))}
        </ul>
      </section>

      {isBeginner && previewMode === 'home' && (
        <section className="stack">
          <h2 className="section-title">Beginner block</h2>
          {(['w1', 'w2', 'w3'] as const).map((week) => (
            <div key={week} className="schedule-block">
              <h3>
                Week {week.slice(1).toUpperCase()}
                {stage === week && <span className="chip"> You are here</span>}
              </h3>
              <ul className="schedule-list">
                {describeBeginnerWeek(week).map((it) => (
                  <li key={it.exerciseId}>
                    <strong>{it.name}</strong> — {it.prescription}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {!isBeginner && (
        <>
          <section className="stack">
            <h2 className="section-title">Split days</h2>
            {SPLIT_DAY_ORDER.map((dayKey) => {
              const day = describeSplitDay(previewMode, dayKey);
              const next = nextSplitDay(lastSplitDay);
              return (
                <div key={dayKey} className="schedule-block">
                  <h3>
                    {day.label}
                    {next === dayKey && previewKind === 'split' && (
                      <span className="chip"> Next split</span>
                    )}
                  </h3>
                  <p className="muted">{day.exercises.join(' · ')}</p>
                </div>
              );
            })}
          </section>
          {previewMode === 'home' && (
            <section className="stack">
              <h2 className="section-title">Full home session</h2>
              <ul className="schedule-list">
                {describeFullSession({
                  mode: 'home',
                  stage: 'standard',
                  state,
                  kind: 'full',
                }).map((item) => (
                  <li key={item.exerciseId}>
                    <strong>{item.name}</strong> — {item.prescription}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {previewMode === 'gym' && !isBeginner && (
        <section className="stack">
          <h2 className="section-title">Gym full session</h2>
          <ul className="schedule-list">
            {describeFullSession({ mode: 'gym', stage: 'standard', state, kind: 'full' }).map((item) => (
              <li key={item.exerciseId}>
                <strong>{item.name}</strong> — {item.prescription}
              </li>
            ))}
          </ul>
        </section>
      )}

      <MobilityGuideSheet open={mobilitySheetOpen} onClose={() => setMobilitySheetOpen(false)} />
    </div>
  );
}
