'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { NOTHING_DURATION_MED, NOTHING_EASE, prefersReducedMotion } from '@/lib/nothing-motion';

/** Subtle enter transition — Nothing-style fade + slight rise. */
export function ScreenEnter({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.from(ref.current, {
        opacity: 0,
        y: 10,
        duration: NOTHING_DURATION_MED,
        ease: NOTHING_EASE,
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="screen-enter">
      {children}
    </div>
  );
}
