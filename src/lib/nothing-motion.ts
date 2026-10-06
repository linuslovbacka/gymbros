import gsap from 'gsap';

/** Nothing OS–like motion: quick ease-out, minimal overshoot. */
export const NOTHING_EASE = 'power2.out';
export const NOTHING_EASE_SNAP = 'power3.out';
export const NOTHING_TAP_SCALE = 0.96;
export const NOTHING_DURATION_FAST = 0.18;
export const NOTHING_DURATION_MED = 0.38;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Short press feedback (button / row tap). */
export function nothingTap(target: HTMLElement | null): void {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(
    target,
    { scale: NOTHING_TAP_SCALE },
    { scale: 1, duration: NOTHING_DURATION_MED, ease: NOTHING_EASE },
  );
}

/** Pop a numeric label when a value changes (e.g. 2/3 → 3/3). */
export function nothingPop(target: HTMLElement | null): void {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(
    target,
    { scale: 0.88, opacity: 0.6 },
    { scale: 1, opacity: 1, duration: NOTHING_DURATION_MED, ease: NOTHING_EASE_SNAP },
  );
}
