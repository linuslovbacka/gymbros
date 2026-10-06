/** Simple week rhythm for the schedule screen (Gymbros — not a fixed 66-day program). */
export interface WeekDayPlan {
  id: number;
  short: string;
  label: string;
}

export const WEEKLY_RHYTHM: WeekDayPlan[] = [
  { id: 1, short: 'Mon', label: 'Train' },
  { id: 2, short: 'Tue', label: 'Train' },
  { id: 3, short: 'Wed', label: 'Train' },
  { id: 4, short: 'Thu', label: 'Train' },
  { id: 5, short: 'Fri', label: 'Train' },
  { id: 6, short: 'Sat', label: 'Train' },
  { id: 0, short: 'Sun', label: 'Rest' },
];

/** JS `Date.getDay()` — 0 Sun … 6 Sat */
export function todayWeekdayId(): number {
  return new Date().getDay();
}
