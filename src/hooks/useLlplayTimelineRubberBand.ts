'use client';

import { useEffect, type RefObject } from 'react';

const MAX_RUBBER = 44;
const RUBBER_RESISTANCE = 0.38;
const SNAP_MS = 380;
const SNAP_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';

function clampRubber(value: number): number {
  if (value > MAX_RUBBER) return MAX_RUBBER + (value - MAX_RUBBER) * 0.15;
  if (value < -MAX_RUBBER) return -MAX_RUBBER + (value + MAX_RUBBER) * 0.15;
  return value;
}

/** Horizontal drag with rubber-band snap-back at scroll limits (LL PLAY habit strip). */
export function useLlplayTimelineRubberBand(
  scrollRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  getRestScrollLeft: () => number,
  onHorizontalDrag?: (active: boolean) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    const scroll = scrollRef.current;
    const track = trackRef.current;
    if (!scroll || !track) return;

    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let rubber = 0;
    let axisLock: 'x' | 'y' | null = null;
    let snapTimer: ReturnType<typeof setTimeout> | null = null;

    const maxScrollLeft = () => Math.max(0, scroll.scrollWidth - scroll.clientWidth);

    const clearSnapTimer = () => {
      if (snapTimer !== null) {
        clearTimeout(snapTimer);
        snapTimer = null;
      }
    };

    const setRubber = (px: number, animate: boolean) => {
      rubber = px;
      clearSnapTimer();
      track.style.transition = animate ? `transform ${SNAP_MS}ms ${SNAP_EASE}` : 'none';
      track.style.transform = `translate3d(${px}px, 0, 0)`;

      if (animate && px === 0) {
        const finish = () => {
          track.style.transition = '';
          track.removeEventListener('transitionend', finish);
          clearSnapTimer();
        };
        track.addEventListener('transitionend', finish);
        snapTimer = setTimeout(finish, SNAP_MS + 40);
      }
    };

    const releaseToRest = () => {
      onHorizontalDrag?.(false);
      setRubber(0, true);

      const target = getRestScrollLeft();
      const max = maxScrollLeft();
      const clamped = Math.max(0, Math.min(target, max));
      scroll.scrollTo({ left: clamped, behavior: 'smooth' });
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      axisLock = null;
      clearSnapTimer();
      track.style.transition = 'none';
      scroll.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      if (axisLock === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        axisLock = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        if (axisLock === 'x') onHorizontalDrag?.(true);
      }

      lastX = e.clientX;
      lastY = e.clientY;

      if (axisLock === 'y') return;

      if (axisLock === 'x' && Math.abs(dx) > 0) {
        e.preventDefault();
      }

      const max = maxScrollLeft();
      const sl = scroll.scrollLeft;
      const next = sl - dx;

      if (max <= 0.5) {
        setRubber(clampRubber(rubber + dx * RUBBER_RESISTANCE), false);
        return;
      }

      if (next < 0) {
        scroll.scrollLeft = 0;
        setRubber(clampRubber(rubber + next * RUBBER_RESISTANCE), false);
        return;
      }

      if (next > max) {
        scroll.scrollLeft = max;
        setRubber(clampRubber(rubber + (next - max) * RUBBER_RESISTANCE), false);
        return;
      }

      scroll.scrollLeft = next;
      if (rubber !== 0) {
        const decayed = rubber * 0.55;
        if (Math.abs(decayed) < 0.4) setRubber(0, false);
        else setRubber(decayed, false);
      }
    };

    const endDrag = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      const wasHorizontal = axisLock === 'x';
      axisLock = null;
      if (scroll.hasPointerCapture(e.pointerId)) {
        scroll.releasePointerCapture(e.pointerId);
      }
      if (wasHorizontal) {
        releaseToRest();
      } else {
        onHorizontalDrag?.(false);
        if (rubber !== 0) setRubber(0, true);
      }
    };

    const onLostCapture = () => {
      if (pointerId === null) return;
      pointerId = null;
      axisLock = null;
      releaseToRest();
    };

    scroll.addEventListener('pointerdown', onPointerDown);
    scroll.addEventListener('pointermove', onPointerMove, { passive: false });
    scroll.addEventListener('pointerup', endDrag);
    scroll.addEventListener('pointercancel', endDrag);
    scroll.addEventListener('lostpointercapture', onLostCapture);

    return () => {
      scroll.removeEventListener('pointerdown', onPointerDown);
      scroll.removeEventListener('pointermove', onPointerMove);
      scroll.removeEventListener('pointerup', endDrag);
      scroll.removeEventListener('pointercancel', endDrag);
      scroll.removeEventListener('lostpointercapture', onLostCapture);
      onHorizontalDrag?.(false);
      clearSnapTimer();
      track.style.transition = '';
      track.style.transform = '';
    };
  }, [enabled, scrollRef, trackRef, getRestScrollLeft, onHorizontalDrag]);
}
