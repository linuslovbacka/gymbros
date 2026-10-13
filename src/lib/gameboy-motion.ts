import gsap from 'gsap';
import { prefersReducedMotion } from './nothing-motion';

const PRESS_SCALE = 0.93;

/** Bouncy press feedback for LL PLAY login controls (login-only). */
export function gameBoyPress(target: HTMLElement | null): void {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(
    target,
    { scale: PRESS_SCALE },
    { scale: 1, duration: 0.45, ease: 'back.out(2)' },
  );
}
