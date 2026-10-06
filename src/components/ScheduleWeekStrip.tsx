'use client';

import { WEEKLY_RHYTHM, todayWeekdayId } from '@/content/schedule-week';
import { localDateISO, weekContaining } from '@/lib/calendar-dates';
import type { HabitTimelineDay } from '@/lib/habit-history';

function weekdayIdFromISO(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay();
}

export function ScheduleWeekStrip({
  sickToday,
  weekByDate,
}: {
  sickToday?: boolean;
  weekByDate?: Map<string, HabitTimelineDay>;
}) {
  const today = todayWeekdayId();
  const todayIso = localDateISO();
  const weekDates = weekContaining(todayIso);
  const dateByWeekday = new Map<number, string>();
  for (const iso of weekDates) {
    dateByWeekday.set(weekdayIdFromISO(iso), iso);
  }

  return (
    <div className="week-strip" role="list" aria-label="This calendar week">
      {WEEKLY_RHYTHM.map((d) => {
        const isToday = d.id === today;
        const iso = dateByWeekday.get(d.id);
        const snap = iso ? weekByDate?.get(iso) : undefined;
        const label = isToday && sickToday ? 'Rest (sick)' : d.label;
        const scoreLabel =
          snap && snap.logged ? `${snap.done}/${snap.total}` : isToday ? '—' : '';

        return (
          <div
            key={d.id}
            role="listitem"
            className={`week-strip-day${isToday ? ' is-today' : ''}${isToday && sickToday ? ' is-sick' : ''}${snap?.sick ? ' is-sick' : ''}`}
            title={
              snap
                ? `${iso} · ${snap.done}/${snap.total}${snap.trained ? ' · trained' : ''}`
                : iso ?? d.short
            }
          >
            <span className="week-strip-short">{d.short}</span>
            {snap && (
              <span className="week-strip-score" aria-hidden="true">
                <span
                  className="week-strip-score-fill"
                  style={{
                    width: snap.logged ? `${Math.round(snap.ratio * 100)}%` : '0%',
                  }}
                />
              </span>
            )}
            <span className="week-strip-label">{label}</span>
            {scoreLabel && <span className="week-strip-pct muted">{scoreLabel}</span>}
          </div>
        );
      })}
    </div>
  );
}
