'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApp } from '@/state/store';
import {
  BEGINNER_ONBOARDING,
  describeBeginnerWeek,
  describeSplitDay,
  SPLIT_DAY_ORDER,
  todayPreview,
  SICK_TRAINING_GUIDE,
  splitDaySuggestion,
} from '@/content/schedule';
import type { Mode, SplitDay } from '@/content/types';
import { SICK_DAY_SCHEDULE_NOTE } from '@/content/diet';
import { ROUTINE_LABELS } from '@/content/routines';
import { HabitTimeline, weekTimelineMap } from '@/components/HabitTimeline';
import { MobilityGuideSheet } from '@/components/MobilityGuideSheet';
import { ScheduleWeekStrip } from '@/components/ScheduleWeekStrip';
import { SkipBeginnerSheet } from '@/components/SkipBeginnerSheet';
import { useHabitHistory } from '@/hooks/useHabitHistory';

type PreviewChoice = 'full' | 'upper' | 'lower';

export function ScheduleScreen() {
  const { user, profile, lastSplitDay, habitsToday, skipBeginnerProgram } = useApp();
  const { days: historyDays, loading: historyLoading } = useHabitHistory(
    user?.id,
    profile,
    habitsToday,
    84,
  );
  const weekByDate = weekTimelineMap(historyDays);
  const sickToday = habitsToday?.sick ?? false;
  const [previewMode, setPreviewMode] = useState<Mode>('home');
  const [previewChoice, setPreviewChoice] = useState<PreviewChoice>('upper');
  const [mobilitySheetOpen, setMobilitySheetOpen] = useState(false);
  const [skipSheetOpen, setSkipSheetOpen] = useState(false);

  const stage = profile?.program_stage ?? 'w1';
  const state = profile?.exercise_state ?? {};

  const preview = useMemo(() => {
    if (!profile) return [];
    const isBeginner = profile.program_stage !== 'standard';
    if (isBeginner && previewMode === 'home') {
      return todayPreview({
        mode: 'home',
        kind: 'full',
        stage: profile.program_stage,
        state: profile.exercise_state,
      });
    }
    const kind = previewChoice === 'full' ? 'full' : 'split';
    const splitDay: SplitDay | undefined =
      previewChoice === 'upper' ? 'upper' : previewChoice === 'lower' ? 'lower' : undefined;
    return todayPreview({
      mode: previewMode,
      kind,
      stage: profile.program_stage,
      state: profile.exercise_state,
      splitDay: kind === 'split' ? splitDay : undefined,
    });
  }, [profile, previewMode, previewChoice]);

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
          <strong>Main</strong> — {ROUTINE_LABELS.main.sub}. <strong>{ROUTINE_LABELS.skills.title}</strong> —{' '}
          {ROUTINE_LABELS.skills.sub}. <strong>{ROUTINE_LABELS.mobility.title}</strong> — timed hips/hamstrings
          session. <strong>{ROUTINE_LABELS.conditioning.title}</strong> — hard cardio when you want it.
        </p>
        <button type="button" className="btn" onClick={() => setMobilitySheetOpen(true)}>
          Mobility & cooldown guide
        </button>
        <Link className="btn btn-primary" href="/workout?routine=mobility">
          Start Mobility session
        </Link>
      </section>

      <section className="stack">
        <h2 className="section-title">{SICK_TRAINING_GUIDE.title}</h2>
        <p className="muted tiny">{SICK_TRAINING_GUIDE.disclaimer}</p>
        <p className="muted">
          <strong>{SICK_TRAINING_GUIDE.skipTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SICK_TRAINING_GUIDE.skip.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SICK_TRAINING_GUIDE.easyTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SICK_TRAINING_GUIDE.easy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SICK_TRAINING_GUIDE.comebackTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SICK_TRAINING_GUIDE.comeback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
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
            onClick={() => {
              setPreviewMode('home');
              if (!isBeginner) setPreviewChoice('upper');
            }}
          >
            Home
          </button>
          <button
            type="button"
            className={`btn ${previewMode === 'gym' ? 'btn-primary' : ''}`}
            onClick={() => {
              setPreviewMode('gym');
              setPreviewChoice('full');
            }}
          >
            Gym
          </button>
          {isBeginner && previewMode === 'home' ? (
            <span className="chip">Beginner {stage.toUpperCase()}</span>
          ) : previewMode === 'home' ? (
            <>
              <button
                type="button"
                className={`btn ${previewChoice === 'upper' ? 'btn-primary' : ''}`}
                onClick={() => setPreviewChoice('upper')}
              >
                Upper
              </button>
              <button
                type="button"
                className={`btn ${previewChoice === 'lower' ? 'btn-primary' : ''}`}
                onClick={() => setPreviewChoice('lower')}
              >
                Lower
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`btn ${previewChoice === 'full' ? 'btn-primary' : ''}`}
                onClick={() => setPreviewChoice('full')}
              >
                Full
              </button>
              <button
                type="button"
                className={`btn ${previewChoice === 'upper' ? 'btn-primary' : ''}`}
                onClick={() => setPreviewChoice('upper')}
              >
                Upper
              </button>
              <button
                type="button"
                className={`btn ${previewChoice === 'lower' ? 'btn-primary' : ''}`}
                onClick={() => setPreviewChoice('lower')}
              >
                Lower
              </button>
            </>
          )}
        </div>
        {!isBeginner && previewChoice !== 'full' && (
          <p className="muted tiny">{splitDaySuggestion(lastSplitDay)}</p>
        )}
        <ul className="schedule-list">
          {preview.map((item) => (
            <li key={item.exerciseId}>
              <strong>{item.name}</strong> — {item.prescription}
              <span className="muted"> ({item.rungName})</span>
            </li>
          ))}
        </ul>
      </section>

      {isBeginner && (
        <section className="stack">
          <h2 className="section-title">{BEGINNER_ONBOARDING.title}</h2>
          {BEGINNER_ONBOARDING.bullets.map((line) => (
            <p key={line} className="muted">
              {line}
            </p>
          ))}
          <p className="muted tiny">{BEGINNER_ONBOARDING.unlockNote}</p>
          <button type="button" className="btn" onClick={() => setSkipSheetOpen(true)}>
            {BEGINNER_ONBOARDING.skipLabel}
          </button>
          {previewMode === 'home' && (
            <>
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
            </>
          )}
        </section>
      )}

      {!isBeginner && (
        <section className="stack">
          <h2 className="section-title">Split days</h2>
          <p className="muted tiny">{splitDaySuggestion(lastSplitDay)}</p>
          {SPLIT_DAY_ORDER.map((dayKey) => {
            const day = describeSplitDay(previewMode, dayKey);
            return (
              <div key={dayKey} className="schedule-block">
                <h3>{day.label}</h3>
                <p className="muted">{day.exercises.join(' · ')}</p>
              </div>
            );
          })}
        </section>
      )}

      <SkipBeginnerSheet
        open={skipSheetOpen}
        onClose={() => setSkipSheetOpen(false)}
        onConfirm={() => skipBeginnerProgram()}
      />

      <MobilityGuideSheet open={mobilitySheetOpen} onClose={() => setMobilitySheetOpen(false)} />
    </div>
  );
}
