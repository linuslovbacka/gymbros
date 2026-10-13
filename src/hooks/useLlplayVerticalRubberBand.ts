'use client';

import { useEffect, type RefObject } from 'react';

/** UIScrollView rubber-band constant (Apple, iOS 6+). */
const RUBBER_COEFF = 0.55;

/** Critically damped spring back to rest (no oscillation). */
const SPRING_STIFFNESS = 280;
const SPRING_DAMPING = 2 * Math.sqrt(SPRING_STIFFNESS);
const SPRING_STOP_PX = 0.35;
const SPRING_STOP_V = 12;
const WHEEL_SNAP_DELAY_MS = 90;

/**
 * Maps raw overscroll distance (finger travel past the edge) to visible offset.
 * b = (1 - 1 / ((x * c / d) + 1)) * d
 */
function iosRubberBandDistance(rawOverscroll: number, dimension: number): number {
  if (rawOverscroll <= 0 || dimension <= 0) return 0;
  return (1 - 1 / ((rawOverscroll * RUBBER_COEFF) / dimension + 1)) * dimension;
}

function rubberTranslateFromAttempted(
  attemptedScrollTop: number,
  maxScrollTop: number,
  dimension: number,
): { scrollTop: number; rubberPx: number; rawOverscroll: number } {
  if (maxScrollTop <= 0) {
    const pull = Math.abs(attemptedScrollTop);
    if (pull <= 0) return { scrollTop: 0, rubberPx: 0, rawOverscroll: 0 };
    const band = iosRubberBandDistance(pull, dimension);
    const sign = attemptedScrollTop <= 0 ? 1 : -1;
    return { scrollTop: 0, rubberPx: sign * band, rawOverscroll: pull };
  }

  if (attemptedScrollTop < 0) {
    const raw = -attemptedScrollTop;
    return { scrollTop: 0, rubberPx: iosRubberBandDistance(raw, dimension), rawOverscroll: raw };
  }
  if (attemptedScrollTop > maxScrollTop) {
    const raw = attemptedScrollTop - maxScrollTop;
    return {
      scrollTop: maxScrollTop,
      rubberPx: -iosRubberBandDistance(raw, dimension),
      rawOverscroll: raw,
    };
  }
  return { scrollTop: attemptedScrollTop, rubberPx: 0, rawOverscroll: 0 };
}

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  return Boolean((target as HTMLElement | null)?.closest('.habit-timeline-scroll'));
}

/** Vertical overscroll rubber-band at scroll limits (iOS UIScrollView-style). */
export function useLlplayVerticalRubberBand(
  scrollRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (!scroll || !content) return;

    let rubberPx = 0;
    let springRaf = 0;
    let wheelEndTimer: ReturnType<typeof setTimeout> | null = null;
    let wheelRawOverscroll = 0;

    let touchActive = false;
    let touchStartY = 0;
    let scrollStartTop = 0;
    let lastTouchY = 0;
    let lastTouchTime = 0;
    let releaseVelocity = 0;

    const dimension = () => scroll.clientHeight;
    const maxScrollTop = () => Math.max(0, scroll.scrollHeight - scroll.clientHeight);

    const stopSpring = () => {
      if (springRaf) {
        cancelAnimationFrame(springRaf);
        springRaf = 0;
      }
    };

    const applyRubber = (px: number) => {
      rubberPx = px;
      content.style.transition = 'none';
      content.style.transform = px === 0 ? '' : `translate3d(0, ${px}px, 0)`;
    };

    const springRubberToZero = (initialVelocity: number) => {
      stopSpring();
      let x = rubberPx;
      let v = initialVelocity;
      let last = performance.now();

      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        const force = -SPRING_STIFFNESS * x - SPRING_DAMPING * v;
        v += force * dt;
        x += v * dt;

        if (Math.abs(x) < SPRING_STOP_PX && Math.abs(v) < SPRING_STOP_V) {
          applyRubber(0);
          content.style.transition = '';
          springRaf = 0;
          return;
        }
        applyRubber(x);
        springRaf = requestAnimationFrame(tick);
      };

      springRaf = requestAnimationFrame(tick);
    };

    const release = (velocityY = 0) => {
      const max = maxScrollTop();
      if (scroll.scrollTop < 0) scroll.scrollTop = 0;
      else if (scroll.scrollTop > max) scroll.scrollTop = max;

      wheelRawOverscroll = 0;

      if (Math.abs(rubberPx) < 0.5) {
        applyRubber(0);
        content.style.transition = '';
        return;
      }

      // Finger velocity → rubber velocity (pull down at top → positive rubberPx increases)
      const rubberVelocity = -velocityY * 0.85;
      springRubberToZero(rubberVelocity);
    };

    const driveFromAttemptedScroll = (attemptedScrollTop: number) => {
      const max = maxScrollTop();
      const dim = dimension();
      const { scrollTop, rubberPx: nextRubber } = rubberTranslateFromAttempted(
        attemptedScrollTop,
        max,
        dim,
      );
      scroll.scrollTop = scrollTop;
      applyRubber(nextRubber);
      return nextRubber !== 0 || attemptedScrollTop < 0 || attemptedScrollTop > max;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (shouldIgnoreTarget(e.target) || e.touches.length !== 1) return;
      stopSpring();
      wheelRawOverscroll = 0;
      touchActive = true;
      touchStartY = e.touches[0].clientY;
      lastTouchY = touchStartY;
      lastTouchTime = performance.now();
      releaseVelocity = 0;
      scrollStartTop = scroll.scrollTop;
      content.style.transition = 'none';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchActive || e.touches.length !== 1) return;
      const y = e.touches[0].clientY;
      const now = performance.now();
      const dt = now - lastTouchTime;
      if (dt > 0) {
        releaseVelocity = (y - lastTouchY) / dt;
      }
      lastTouchY = y;
      lastTouchTime = now;

      const attempted = scrollStartTop - (y - touchStartY);
      driveFromAttemptedScroll(attempted);
      e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!touchActive) return;
      touchActive = false;
      release(releaseVelocity);
    };

    const onWheel = (e: WheelEvent) => {
      if (shouldIgnoreTarget(e.target)) return;
      const max = maxScrollTop();
      const st = scroll.scrollTop;
      const atTop = st <= 0;
      const atBottom = st >= max - 0.5;
      const dim = dimension();

      if (!((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0) || max <= 0.5)) {
        if (wheelRawOverscroll > 0) {
          wheelRawOverscroll = Math.max(0, wheelRawOverscroll * 0.6);
          if (wheelRawOverscroll < 0.5) {
            wheelRawOverscroll = 0;
            release(0);
          }
        }
        return;
      }

      e.preventDefault();
      stopSpring();

      if (max <= 0.5) {
        wheelRawOverscroll += Math.abs(e.deltaY);
        const band = iosRubberBandDistance(wheelRawOverscroll, dim);
        applyRubber(e.deltaY < 0 ? band : -band);
      } else if (atTop && e.deltaY < 0) {
        wheelRawOverscroll += -e.deltaY;
        applyRubber(iosRubberBandDistance(wheelRawOverscroll, dim));
        scroll.scrollTop = 0;
      } else if (atBottom && e.deltaY > 0) {
        wheelRawOverscroll += e.deltaY;
        applyRubber(-iosRubberBandDistance(wheelRawOverscroll, dim));
        scroll.scrollTop = max;
      }

      if (wheelEndTimer) clearTimeout(wheelEndTimer);
      wheelEndTimer = setTimeout(() => release(0), WHEEL_SNAP_DELAY_MS);
    };

    scroll.addEventListener('touchstart', onTouchStart, { passive: true });
    scroll.addEventListener('touchmove', onTouchMove, { passive: false });
    scroll.addEventListener('touchend', onTouchEnd);
    scroll.addEventListener('touchcancel', onTouchEnd);
    scroll.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      scroll.removeEventListener('touchstart', onTouchStart);
      scroll.removeEventListener('touchmove', onTouchMove);
      scroll.removeEventListener('touchend', onTouchEnd);
      scroll.removeEventListener('touchcancel', onTouchEnd);
      scroll.removeEventListener('wheel', onWheel);
      if (wheelEndTimer) clearTimeout(wheelEndTimer);
      stopSpring();
      content.style.transition = '';
      content.style.transform = '';
    };
  }, [enabled, scrollRef, contentRef]);
}
