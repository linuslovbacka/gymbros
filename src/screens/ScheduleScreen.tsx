'use client';

import Link from 'next/link';
import { useApp } from '@/state/store';
import {
  SCHEDULE_TRAIN_LEAD,
  SICK_TRAINING_GUIDE,
  SORENESS_TRAINING_GUIDE,
} from '@/content/schedule';
import { SICK_DAY_SCHEDULE_NOTE } from '@/content/diet';
import { weekTimelineMap } from '@/components/HabitTimeline';
import { ScheduleWeekStrip } from '@/components/ScheduleWeekStrip';
import { useHabitHistory } from '@/hooks/useHabitHistory';

export function ScheduleScreen() {
  const { user, profile, habitsToday } = useApp();
  const { days: historyDays } = useHabitHistory(user?.id, profile, habitsToday, 7);
  const weekByDate = weekTimelineMap(historyDays);
  const sickToday = habitsToday?.sick ?? false;

  if (!profile) return null;

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
        <p className="muted">{SCHEDULE_TRAIN_LEAD}</p>
        <p className="muted tiny">
          Mon–Sat are training days when you&apos;re well; Sunday is rest. Habit scores show how the day went — open
          TRAIN on home for today&apos;s session.
        </p>
        <ScheduleWeekStrip sickToday={sickToday} weekByDate={weekByDate} />
        {sickToday && <p className="muted schedule-sick-note">{SICK_DAY_SCHEDULE_NOTE}</p>}
      </section>

      <section className="stack">
        <h2 className="section-title">{SORENESS_TRAINING_GUIDE.title}</h2>
        <p className="muted tiny">{SORENESS_TRAINING_GUIDE.disclaimer}</p>
        <p className="muted">
          <strong>{SORENESS_TRAINING_GUIDE.okTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SORENESS_TRAINING_GUIDE.ok.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SORENESS_TRAINING_GUIDE.swapTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SORENESS_TRAINING_GUIDE.swap.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SORENESS_TRAINING_GUIDE.backOffTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SORENESS_TRAINING_GUIDE.backOff.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted tiny">{SORENESS_TRAINING_GUIDE.appNote}</p>
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
    </div>
  );
}
