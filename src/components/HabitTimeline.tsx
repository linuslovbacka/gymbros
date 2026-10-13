'use client';

import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useLlplayTimelineRubberBand } from '@/hooks/useLlplayTimelineRubberBand';
import { weekContaining } from '@/lib/calendar-dates';
import {
  formatTimelineLabel,
  habitDayVisualClasses,
  timelineSummary,
  type HabitTimelineDay,
} from '@/lib/habit-history';

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
  variant = 'default',
  centerOnToday,
}: {
  days: HabitTimelineDay[];
  loading?: boolean;
  /** Shorter bar on home screen */
  compact?: boolean;
  hideLegend?: boolean;
  title?: string;
  variant?: 'default' | 'llplay';
  /** Scroll so today's bar is centered in the viewport */
  centerOnToday?: boolean;
}) {
  const summary = useMemo(() => timelineSummary(days), [days]);
  const weekStart = days.length ? weekContaining(days[days.length - 1]!.date)[0] : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const todayCellRef = useRef<HTMLDivElement>(null);
  const restScrollLeftRef = useRef(0);
  const draggingRef = useRef(false);
  const isLlplay = variant === 'llplay';

  const scrollTodayToCenter = useCallback(() => {
    const scroll = scrollRef.current;
    const todayEl = todayCellRef.current;
    if (!scroll || !todayEl) return;

    const scrollRect = scroll.getBoundingClientRect();
    const todayRect = todayEl.getBoundingClientRect();
    const cellCenterInContent =
      todayRect.left - scrollRect.left + scroll.scrollLeft + todayRect.width / 2;
    const target = cellCenterInContent - scroll.clientWidth / 2;
    const maxScroll = scroll.scrollWidth - scroll.clientWidth;
    const next = Math.max(0, Math.min(target, maxScroll));
    scroll.scrollLeft = next;
    restScrollLeftRef.current = next;
  }, []);

  const getRestScrollLeft = useCallback(() => restScrollLeftRef.current, []);

  const setTimelineDragging = useCallback((active: boolean) => {
    draggingRef.current = active;
  }, []);

  useLlplayTimelineRubberBand(
    scrollRef,
    trackRef,
    isLlplay && !loading,
    getRestScrollLeft,
    setTimelineDragging,
  );

  useLayoutEffect(() => {
    if (!centerOnToday || loading) return;

    scrollTodayToCenter();
    const raf = requestAnimationFrame(scrollTodayToCenter);

    const scroll = scrollRef.current;
    if (!scroll) return () => cancelAnimationFrame(raf);

    const ro = new ResizeObserver(() => {
      if (draggingRef.current) return;
      scrollTodayToCenter();
    });
    ro.observe(scroll);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [days, loading, centerOnToday, scrollTodayToCenter]);

  const wrapClass = [
    'habit-timeline-wrap',
    compact ? 'is-compact' : '',
    isLlplay ? 'is-llplay' : '',
    centerOnToday && isLlplay ? 'is-center-today' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass}>
      {!isLlplay && (
        <div className="habit-timeline-head">
          <span className="habit-timeline-title">{title}</span>
          {!loading && days.length > 0 && (
            <span className="habit-timeline-meta muted">
              {summary.fullDays} perfect · {Math.round(summary.avgRatio * 100)}% avg
            </span>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        className="habit-timeline-scroll"
        role="img"
        aria-label={
          loading
            ? 'Loading habit history'
            : `${summary.loggedDays} days logged in the last ${days.length} days`
        }
      >
        <div className="habit-timeline" ref={trackRef}>
          {days.map((d) => {
            const pct = Math.round(d.ratio * 100);
            const weekBoundary = weekStart && d.date === weekStart;
            return (
              <div
                key={d.date}
                ref={d.isToday ? todayCellRef : undefined}
                className={`habit-timeline-cell ${habitDayVisualClasses(d)}${weekBoundary ? ' week-start' : ''}`}
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

      {!hideLegend && !isLlplay && (
        <p className="habit-timeline-legend muted">
          Each bar is one day (left = older). Height = daily score. Orange = today · Black = trained · Grey = no
          training · Grey outline = sick.
        </p>
      )}
    </div>
  );
}

/** Map of date → timeline day for the current calendar week. */
export function weekTimelineMap(days: HabitTimelineDay[]): Map<string, HabitTimelineDay> {
  return new Map(days.map((d) => [d.date, d]));
}
