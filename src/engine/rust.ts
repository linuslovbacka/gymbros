// Rust / rest-token streak system (spec section 9 — "rust, not strip").
//
// Design constraints that shape this engine:
//  • There is no server cron. A lapse can only be detected from the wall-clock
//    gap whenever the profile is read, so `reconcileLapse` is a PURE function
//    run lazily on load AND at the top of completeSession.
//  • Lapses must STING but stay RECOVERABLE: a gap first burns an absence
//    buffer ("rest tokens"); only once that is exhausted does the equipped set
//    go rusty. Rust is sticky — it clears only after a few sessions back, and
//    the streak resumes from where it rusted, never zero.
//
// All thresholds are tunable (spec section 14). Tokens here behave as a
// per-absence buffer that resets when you train: short, normal rest gaps never
// cost anything; only a genuine multi-day disappearance rusts you.

export const RUST_GRACE_DAYS = 2;          // days away before the buffer is touched
export const REST_TOKENS = 3;              // absence buffer beyond the grace window
export const RUST_RECOVERY_SESSIONS = 3;   // sessions back to fully de-rust
export const COMEBACK_GAP_DAYS = 7;        // gap that counts as a "comeback"

export interface RustState {
  /** Equipped set is currently dull/cracked. */
  rusty: boolean;
  /** Streak value frozen at the moment rust hit, so it can resume (not reset). */
  rustedStreak: number;
  /** Sessions logged since rust began (drives de-rust). */
  recoverySessions: number;
  /** Times the player has returned after a 7+ day gap (for "No Quit"). */
  comebackCount: number;
}

export function defaultRustState(): RustState {
  return { rusty: false, rustedStreak: 0, recoverySessions: 0, comebackCount: 0 };
}

/** Tolerant parse of the loosely-typed `rust_state` jsonb column. */
export function parseRustState(raw: unknown): RustState {
  const r = (raw ?? {}) as Partial<RustState>;
  return {
    rusty: Boolean(r.rusty),
    rustedStreak: typeof r.rustedStreak === 'number' ? r.rustedStreak : 0,
    recoverySessions: typeof r.recoverySessions === 'number' ? r.recoverySessions : 0,
    comebackCount: typeof r.comebackCount === 'number' ? r.comebackCount : 0,
  };
}

const DAY_MS = 86_400_000;

function dayNumber(iso: string): number {
  return Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY_MS);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Whole days between the last training day and `now` (0 if trained today). */
export function gapDays(streakLastDate: string | null, now: Date): number {
  if (!streakLastDate) return 0;
  return Math.max(0, dayNumber(now.toISOString()) - dayNumber(streakLastDate));
}

/** Absence days that have eaten into the buffer (beyond the grace window). */
export function missedDays(streakLastDate: string | null, now: Date): number {
  return Math.max(0, gapDays(streakLastDate, now) - RUST_GRACE_DAYS);
}

export interface ReconcileResult {
  rustState: RustState;
  restTokens: number;
  restTokensMonth: string;
  changed: boolean;
}

/** The fields reconcileLapse reads — a structural subset of Profile. */
export interface LapseInput {
  streak_count: number;
  streak_last_date: string | null;
  rest_tokens: number;
  rest_tokens_month: string | null;
  rust_state: unknown;
}

/**
 * Project the passage of time onto token/rust state. Idempotent: rust onset is
 * sticky (set once, cleared only by recovery) and tokens are derived purely
 * from the current gap, so running this repeatedly in a day is a no-op.
 */
export function reconcileLapse(p: LapseInput, now: Date): ReconcileResult {
  const rs = parseRustState(p.rust_state);
  const today = now.toISOString().slice(0, 10);
  const month = monthKey(today);

  const missed = missedDays(p.streak_last_date, now);
  const restTokens = Math.max(0, REST_TOKENS - missed);

  let rusty = rs.rusty;
  let rustedStreak = rs.rustedStreak;
  if (!rusty && missed > REST_TOKENS) {
    rusty = true;
    rustedStreak = p.streak_count;
  }

  const rustState: RustState = { ...rs, rusty, rustedStreak };
  const changed =
    restTokens !== p.rest_tokens ||
    month !== p.rest_tokens_month ||
    rusty !== rs.rusty ||
    rustedStreak !== rs.rustedStreak;

  return { rustState, restTokens, restTokensMonth: month, changed };
}

export interface RecoveryResult {
  rustState: RustState;
  restTokens: number;
  restTokensMonth: string;
  /** This session counts as a comeback (gap >= COMEBACK_GAP_DAYS). */
  justReturned: boolean;
  /** Gear fully de-rusted on this session (for the Phoenix achievement). */
  deRusted: boolean;
  /** The streak value to persist after this session. */
  streakCount: number;
}

/**
 * Apply a freshly-completed session to the (already reconciled) rust state:
 * advance recovery, clear rust after enough sessions, count comebacks, and
 * decide how the streak moves — frozen while rusty, resuming on de-rust.
 */
export function applySessionToRust(
  before: RustState,
  args: { streakCount: number; streakLastDate: string | null; today: string },
  now: Date,
): RecoveryResult {
  const month = monthKey(args.today);
  const gap = gapDays(args.streakLastDate, now);
  const justReturned = gap >= COMEBACK_GAP_DAYS;

  let next: RustState = { ...before };
  let deRusted = false;

  if (before.rusty) {
    const recoverySessions = before.recoverySessions + 1;
    if (recoverySessions >= RUST_RECOVERY_SESSIONS) {
      next = { ...next, rusty: false, recoverySessions: 0 };
      deRusted = true;
    } else {
      next = { ...next, recoverySessions };
    }
  }

  if (justReturned) next = { ...next, comebackCount: next.comebackCount + 1 };

  // Streak: frozen at the rusted value through recovery; normal increment
  // otherwise (a token-covered lapse still "survives" and keeps counting).
  const streakCount = before.rusty
    ? before.rustedStreak
    : args.streakLastDate === args.today
      ? args.streakCount
      : args.streakCount + 1;

  // Training ends the absence, so the buffer is full again.
  return { rustState: next, restTokens: REST_TOKENS, restTokensMonth: month, justReturned, deRusted, streakCount };
}
