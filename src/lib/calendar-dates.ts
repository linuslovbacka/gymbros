/** Calendar day as YYYY-MM-DD (local timezone). */
export function localDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, delta: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + delta);
  return localDateISO(d);
}

/** Inclusive range from `start` through `end` (both YYYY-MM-DD). */
export function eachDayISO(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** Last `count` calendar days ending today (local). */
export function lastNDaysEndingToday(count: number): string[] {
  const end = localDateISO();
  const start = addDays(end, -(count - 1));
  return eachDayISO(start, end);
}

/** Monday-based week containing `iso` (local): Mon … Sun as YYYY-MM-DD. */
export function weekContaining(iso: string): string[] {
  const d = parseLocalDate(iso);
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const mon = addDays(iso, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}
