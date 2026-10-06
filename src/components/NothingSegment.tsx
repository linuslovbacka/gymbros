'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { NOTHING_DURATION_FAST, NOTHING_EASE, nothingTap, prefersReducedMotion } from '@/lib/nothing-motion';

export function NothingSegment<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !trackRef.current || !indicatorRef.current) return;
      const active = trackRef.current.querySelector<HTMLButtonElement>(`[data-seg-id="${value}"]`);
      if (!active) return;
      const track = trackRef.current.getBoundingClientRect();
      const btn = active.getBoundingClientRect();
      gsap.to(indicatorRef.current, {
        x: btn.left - track.left,
        width: btn.width,
        duration: NOTHING_DURATION_FAST,
        ease: NOTHING_EASE,
      });
    },
    { dependencies: [value], scope: trackRef },
  );

  return (
    <div className={`nothing-segment ${className ?? ''}`} ref={trackRef} role="tablist">
      <span className="nothing-segment-indicator" ref={indicatorRef} aria-hidden="true" />
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          data-seg-id={opt.id}
          aria-selected={value === opt.id}
          className={value === opt.id ? 'active' : ''}
          disabled={opt.disabled}
          onClick={() => {
            nothingTap(trackRef.current);
            onChange(opt.id);
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
