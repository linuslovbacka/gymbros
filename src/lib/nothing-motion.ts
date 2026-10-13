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

export const LLPLAY_CARD_Y = 8;
export const LLPLAY_CARD_STAGGER = 0.04;

function asElements(targets: ArrayLike<Element> | null | undefined): HTMLElement[] {
  if (!targets || targets.length === 0) return [];
  return Array.from(targets).filter((el): el is HTMLElement => el instanceof HTMLElement);
}

function waitGsap(ms: number, run: (done: () => void) => void): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    run(done);
    window.setTimeout(done, ms);
  });
}

/** Staggered fade+rise used by home habits and train choice pills. */
export function llplayCardsEnter(targets: ArrayLike<Element> | null | undefined): Promise<void> {
  const els = asElements(targets);
  if (els.length === 0) return Promise.resolve();
  gsap.killTweensOf(els);
  if (prefersReducedMotion()) {
    gsap.set(els, { autoAlpha: 1, y: 0 });
    return Promise.resolve();
  }
  const stagger = els.length > 1 ? LLPLAY_CARD_STAGGER : 0;
  return waitGsap((NOTHING_DURATION_MED + stagger * els.length + 0.08) * 1000, (done) => {
    gsap.fromTo(
      els,
      { autoAlpha: 0, y: LLPLAY_CARD_Y },
      {
        autoAlpha: 1,
        y: 0,
        duration: NOTHING_DURATION_MED,
        ease: NOTHING_EASE,
        stagger,
        onComplete: done,
      },
    );
  });
}

/** Reverse of enter — fade up and out before swapping train/home card stacks. */
export function llplayCardsExit(targets: ArrayLike<Element> | null | undefined): Promise<void> {
  const els = asElements(targets);
  if (els.length === 0) return Promise.resolve();
  gsap.killTweensOf(els);
  if (prefersReducedMotion()) {
    gsap.set(els, { autoAlpha: 0, y: -LLPLAY_CARD_Y });
    return Promise.resolve();
  }
  const stagger = els.length > 1 ? LLPLAY_CARD_STAGGER / 2 : 0;
  return waitGsap((NOTHING_DURATION_MED + stagger * els.length + 0.08) * 1000, (done) => {
    gsap.to(els, {
      autoAlpha: 0,
      y: -LLPLAY_CARD_Y,
      duration: NOTHING_DURATION_MED,
      ease: NOTHING_EASE,
      stagger,
      onComplete: done,
    });
  });
}
