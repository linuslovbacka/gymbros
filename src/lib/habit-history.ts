import { habitScore } from '@/lib/habits-score';
import { eachDayISO, lastNDaysEndingToday, localDateISO } from '@/lib/calendar-dates';
import type { HabitsToday } from '@/state/types';

export interface HabitDayRow {
  date: string;
  no_sugar: boolean;
  protein_met: boolean;
  protein_g?: number;
  water_met: boolean;
  steps_met: boolean;
  sick: boolean;
}

export interface HabitTimelineDay {
  date: string;
  done: number;
  total: number;
  ratio: number;
  sick: boolean;
  trained: boolean;
  isToday: boolean;
  /** Any habit checked or a session logged. */
  logged: boolean;
}

const emptyHabits = (): HabitsToday => ({
  no_sugar: false,
  protein_met: false,
  protein_g: 0,
  water_met: false,
  steps_met: false,
  sick: false,
});

export function sessionDateFromCreatedAt(createdAt: string): string {
  return localDateISO(new Date(createdAt));
}

export function buildHabitTimeline(input: {
  dates: string[];
  habitRows: HabitDayRow[];
  sessionDates: Set<string>;
  todayOverride?: { habits: HabitsToday; trainedToday: boolean };
}): HabitTimelineDay[] {
  const byDate = new Map(input.habitRows.map((r: HabitDayRow) => [r.date, r]));
  const today = localDateISO();

  return input.dates.map((date) => {
    const row = byDate.get(date);
    const habits: HabitsToday = row
      ? {
          no_sugar: row.no_sugar,
          protein_met: row.protein_met,
          protein_g: row.protein_g ?? 0,
          water_met: row.water_met,
          steps_met: row.steps_met,
          sick: row.sick,
        }
      : emptyHabits();

    let trained = input.sessionDates.has(date);
    if (date === today && input.todayOverride) {
      trained = input.todayOverride.trainedToday;
    }

    const h =
      date === today && input.todayOverride ? input.todayOverride.habits : habits;
    const { done, total } = habitScore(h, trained);
    const logged =
      trained ||
      h.no_sugar ||
      h.protein_met ||
      h.water_met ||
      h.steps_met ||
      h.sick;

    return {
      date,
      done,
      total,
      ratio: total > 0 ? done / total : 0,
      sick: h.sick,
      trained,
      isToday: date === today,
      logged,
    };
  });
}

export function defaultTimelineRange(dayCount = 84): string[] {
  return lastNDaysEndingToday(dayCount);
}

export function timelineSummary(days: HabitTimelineDay[]): {
  loggedDays: number;
  fullDays: number;
  avgRatio: number;
} {
  const logged = days.filter((d) => d.logged);
  const full = logged.filter((d) => d.ratio >= 1);
  const avg =
    logged.length > 0 ? logged.reduce((s, d) => s + d.ratio, 0) / logged.length : 0;
  return { loggedDays: logged.length, fullDays: full.length, avgRatio: avg };
}

export function formatTimelineLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** For merging fetch windows when extending history later. */
export function dateRangeStartEnd(dates: string[]): { start: string; end: string } | null {
  if (dates.length === 0) return null;
  return { start: dates[0]!, end: dates[dates.length - 1]! };
}

export function isoRangeInclusive(start: string, end: string): string[] {
  return eachDayISO(start, end);
}
