'use client';

import Image from 'next/image';
import { useMemo, useRef, type RefObject } from 'react';
import { DietScreen } from '@/screens/DietScreen';
import { ScheduleScreen } from '@/screens/ScheduleScreen';
import { useLlplayVerticalRubberBand } from '@/hooks/useLlplayVerticalRubberBand';
import { gameBoyPress } from '@/lib/gameboy-motion';

export type DetailsTab = 'diet' | 'schedule';

export function DetailsScreen({
  framed = false,
  tab = 'diet',
  onTab,
  onHome,
  layerRef,
  scrollBodyRef,
  layerZ,
}: {
  framed?: boolean;
  tab?: DetailsTab;
  onTab?: (tab: DetailsTab) => void;
  onHome?: () => void;
  layerRef?: RefObject<HTMLDivElement | null>;
  scrollBodyRef?: RefObject<HTMLDivElement | null>;
  layerZ?: number;
}) {
  const localScrollRef = useRef<HTMLDivElement>(null);
  const localBodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = layerRef ?? localScrollRef;
  const bodyRef = scrollBodyRef ?? localBodyRef;
  const setTab = onTab ?? (() => undefined);

  useLlplayVerticalRubberBand(scrollRef, bodyRef, true);

  const segment = useMemo(
    () => (
      <div className="llplay-details-segment-wrap">
        <div className="llplay-details-segment" role="tablist" aria-label="Details">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'diet'}
            className={`llplay-details-segment-btn llplay-card${tab === 'diet' ? ' is-active' : ''}`}
            data-llplay-card
            onClick={(e) => {
              gameBoyPress(e.currentTarget);
              setTab('diet');
            }}
          >
            Diet
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'schedule'}
            className={`llplay-details-segment-btn llplay-card${tab === 'schedule' ? ' is-active' : ''}`}
            data-llplay-card
            onClick={(e) => {
              gameBoyPress(e.currentTarget);
              setTab('schedule');
            }}
          >
            Schedule
          </button>
        </div>
      </div>
    ),
    [tab, setTab],
  );

  return (
    <div
      className={`auth-llplay__screen-inner llplay-details${framed ? ' llplay-lcd-layer' : ''}${layerZ === 2 ? ' is-front' : ''}`}
      ref={scrollRef}
      style={layerZ != null ? { zIndex: layerZ } : undefined}
    >
      <div className="llplay-details-scroll-inner" ref={bodyRef}>
        <div className="llplay-details-chrome">
          <button
            type="button"
            className="llplay-details-home-logo llplay-card"
            data-llplay-card
            aria-label="Back to home"
            onClick={(e) => {
              gameBoyPress(e.currentTarget);
              onHome?.();
            }}
          >
            <Image src="/ui/login/logo-barbell.svg" alt="" width={79} height={79} priority />
          </button>
          {segment}
        </div>
        {tab === 'diet' ? (
          <DietScreen embedded variant="llplay" />
        ) : (
          <ScheduleScreen embedded variant="llplay" />
        )}
      </div>
    </div>
  );
}
