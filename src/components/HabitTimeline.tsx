'use client';

import { useMemo } from 'react';
import { weekContaining } from '@/lib/calendar-dates';
import { formatTimelineLabel, timelineSummary, type HabitTimelineDay } from '@/lib/habit-history';

function dayTitle(d: HabitTimelineDay): string {
  const base = formatTimelineLabel(d.date);
  if (!d.logged) return `${base} — no log yet`;
  if (d.sick) return `${base} — sick · ${d.done}/${d.total} habits`;
  return `${base} — ${d.done}/${d.total}${d.trained ? ' · trained' : ''}`;
}

export function HabitTimeline({
  days,
  loading,
  compact,
  hideLegend,
  title = 'Habit history',
}: {
  days: HabitTimelineDay[];
  loading?: boolean;
  /** Shorter bar on home screen */
  compact?: boolean;
  hideLegend?: boolean;
  title?: string;
}) {
  const summary = useMemo(() => timelineSummary(days), [days]);
  const weekStart = days.length ? weekContaining(days[days.length - 1]!.date)[0] : null;

  return (
    <div className={`habit-timeline-wrap${compact ? ' is-compact' : ''}`}>
      <div className="habit-timeline-head">
        <span className="habit-timeline-title">{title}</span>
        {!loading && days.length > 0 && (
          <span className="habit-timeline-meta muted">
            {summary.fullDays} perfect · {Math.round(summary.avgRatio * 100)}% avg
          </span>
        )}
      </div>

      <div
        className="habit-timeline-scroll"
        role="img"
        aria-label={
          loading
            ? 'Loading habit history'
            : `${summary.loggedDays} days logged in the last ${days.length} days`
        }
      >
        <div className="habit-timeline">
          {days.map((d) => {
            const pct = Math.round(d.ratio * 100);
            const weekBoundary = weekStart && d.date === weekStart;
            return (
              <div
                key={d.date}
                className={`habit-timeline-cell${d.isToday ? ' is-today' : ''}${weekBoundary ? ' week-start' : ''}${d.sick ? ' is-sick' : ''}${!d.logged ? ' is-empty' : ''}`}
                title={dayTitle(d)}
              >
                <div
                  className="habit-timeline-fill"
                  style={{ height: d.logged ? `${Math.max(pct, 8)}%` : '0%' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!hideLegend && (
        <p className="habit-timeline-legend muted">
          Each bar is one day (left = older). Height = daily score. Orange line = sick. Dark edge = today.
        </p>
      )}
    </div>
  );
}

/** Map of date → timeline day for the current calendar week. */
export function weekTimelineMap(days: HabitTimelineDay[]): Map<string, HabitTimelineDay> {
  return new Map(days.map((d) => [d.date, d]));
}
