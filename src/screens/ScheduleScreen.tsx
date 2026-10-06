'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApp } from '@/state/store';
import {
  DIRECTION_ORDER,
  describeBeginnerWeek,
  describeFullSession,
  describeSplitDay,
  todayPreview,
} from '@/content/schedule';
import type { Mode } from '@/content/types';
import { SICK_DAY_SCHEDULE_NOTE } from '@/content/diet';
import { HabitTimeline, weekTimelineMap } from '@/components/HabitTimeline';
import { ScheduleWeekStrip } from '@/components/ScheduleWeekStrip';
import { useHabitHistory } from '@/hooks/useHabitHistory';

export function ScheduleScreen() {
  const { user, profile, lastSplitDirection, habitsToday } = useApp();
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

  const stage = profile?.program_stage ?? 'w1';
  const state = profile?.exercise_state ?? {};

  const preview = useMemo(() => {
    if (!profile) return [];
    return todayPreview({
      mode: previewMode,
      kind: previewKind,
      stage: profile.program_stage,
      state: profile.exercise_state,
      lastSplitDirection,
    });
  }, [profile, previewMode, previewKind, lastSplitDirection]);

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

      {!isBeginner && previewMode === 'home' && (
        <>
          <section className="stack">
            <h2 className="section-title">Split days</h2>
            {DIRECTION_ORDER.map((dir) => {
              const day = describeSplitDay('home', dir);
              const next = lastSplitDirection
                ? DIRECTION_ORDER[(DIRECTION_ORDER.indexOf(lastSplitDirection) + 1) % 3]
                : 'up';
              return (
                <div key={dir} className="schedule-block">
                  <h3>
                    {dir.toUpperCase()}
                    {next === dir && previewKind === 'split' && (
                      <span className="chip"> Next split</span>
                    )}
                  </h3>
                  <p className="muted">
                    Pull: {day.pull} · Push: {day.push} · Core: {day.core}
                  </p>
                </div>
              );
            })}
          </section>
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
    </div>
  );
}
