'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { RefObject } from 'react';
import { useCallback, useRef } from 'react';
import { useApp } from '@/state/store';
import { Avatar, derivePhysiqueTier } from '@/components/Avatar';
import { AvatarStage } from '@/components/AvatarStage';
import { ProModeHeader } from '@/components/ProModeHeader';
import { DailyChecks } from '@/components/DailyChecks';
import { HabitTimeline } from '@/components/HabitTimeline';
import { useHabitHistory } from '@/hooks/useHabitHistory';
import { useLlplayVerticalRubberBand } from '@/hooks/useLlplayVerticalRubberBand';
import { getCosmetic } from '@/content/cosmetics';
import { MVP_MODE } from '@/lib/mvp';
import type { Profile } from '@/state/types';

const TODAY = new Date().toISOString().slice(0, 10);

function Fighter({ p, opponentIron, onSelect }: { p: Profile; opponentIron: number | null; onSelect?: () => void }) {
  const rusty = !MVP_MODE && (p.rust_state?.rusty ?? false);
  const titleSlug = p.equipped?.title;
  const title = !MVP_MODE && titleSlug ? getCosmetic(titleSlug)?.name : undefined;
  const trainedToday = p.streak_last_date === TODAY;
  const level = derivePhysiqueTier(p.upper_tier, p.lower_tier);
  const FigureTag = onSelect ? 'button' : 'div';
  return (
    <div className="fighter">
      <FigureTag
        className={`fighter-figure${onSelect ? ' is-tappable' : ''}`}
        onClick={onSelect}
        {...(onSelect ? { 'aria-label': 'Open locker', title: 'Open locker' } : {})}
      >
        <img className="foot-shadow" src="/ui/foot-shadow.svg" alt="" aria-hidden="true" />
        <AvatarStage profile={p} opponentIron={opponentIron} />
      </FigureTag>
      <div className="fighter-name">
        {p.display_name ?? 'Bro'}
        {trainedToday && <span className="today-dot" title="Trained today" />}
      </div>
      <div className="fighter-level">LEVEL {level}</div>
      {title && <div className="fighter-title">{title}</div>}
      {rusty && <div className="rust-badge">RUSTY</div>}
      {!MVP_MODE && (
        <div className="fighter-tiers">
          <span className="tier-badge">UP {p.upper_tier}</span>
          <span className="tier-badge">LO {p.lower_tier}</span>
          {p.streak_count > 0 && <span className="tier-badge streak">STREAK {p.streak_count}</span>}
        </div>
      )}
    </div>
  );
}

function MvpLlPlayHome({
  profile,
  partner,
  historyDays,
  historyLoading,
  sickToday,
  onTrain,
  layerRef,
  scrollBodyRef,
  layerZ,
}: {
  profile: Profile;
  partner: Profile | null | undefined;
  historyDays: Parameters<typeof HabitTimeline>[0]['days'];
  historyLoading: boolean;
  sickToday: boolean;
  onTrain: () => void;
  layerRef?: RefObject<HTMLDivElement | null>;
  scrollBodyRef?: RefObject<HTMLDivElement | null>;
  layerZ?: number;
}) {
  const localScreenRef = useRef<HTMLDivElement>(null);
  const localScrollRef = useRef<HTMLDivElement>(null);
  const screenRef = layerRef ?? localScreenRef;
  const bodyRef = scrollBodyRef ?? localScrollRef;
  const checksRef = useRef<HTMLDivElement>(null);

  useLlplayVerticalRubberBand(screenRef, bodyRef, true);

  const handleTrain = useCallback(() => {
    if (sickToday) return;
    onTrain();
  }, [sickToday, onTrain]);

  return (
    <div
      className={`auth-llplay__screen-inner llplay-home llplay-lcd-layer${layerZ === 2 ? ' is-front' : ''}`}
      ref={screenRef}
      style={layerZ != null ? { zIndex: layerZ } : undefined}
    >
      <div className="llplay-home__scroll-body" ref={bodyRef}>
        <Image
          src="/ui/login/logo-barbell.svg"
          alt=""
          width={79}
          height={79}
          className="auth-llplay__logo llplay-home__logo"
          priority
        />
        <p className="llplay-home__days">D{profile.days_trained}</p>
        <HabitTimeline
          days={historyDays}
          loading={historyLoading}
          hideLegend
          variant="llplay"
          centerOnToday
        />
        <DailyChecks
          variant="llplay"
          partnerProfile={partner}
          onTrain={handleTrain}
          containerRef={checksRef}
        />
      </div>
    </div>
  );
}

function RestTokens({ count }: { count: number }) {
  return (
    <div className="rest-tokens" title="Rest tokens — buffer before your gear rusts">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`token ${i < count ? 'on' : 'off'}`} />
      ))}
    </div>
  );
}

export function StartScreen({
  onTrain,
  onLocker,
  onSchedule,
  framed = false,
  layerRef,
  scrollBodyRef,
  layerZ,
}: {
  onTrain: () => void;
  onLocker?: () => void;
  onSchedule?: () => void;
  framed?: boolean;
  layerRef?: RefObject<HTMLDivElement | null>;
  scrollBodyRef?: RefObject<HTMLDivElement | null>;
  layerZ?: number;
}) {
  const { user, profile, partner, habitsToday, pressProMode, signOut } = useApp();
  const { days: historyDays, loading: historyLoading } = useHabitHistory(
    user?.id,
    profile,
    habitsToday,
    42,
  );
  if (!profile) return null;

  const sickToday = habitsToday?.sick ?? false;
  if (MVP_MODE) {
    return (
      <MvpLlPlayHome
        profile={profile}
        partner={partner}
        historyDays={historyDays}
        historyLoading={historyLoading}
        sickToday={sickToday}
        onTrain={onTrain}
        layerRef={framed ? layerRef : undefined}
        scrollBodyRef={framed ? scrollBodyRef : undefined}
        layerZ={framed ? layerZ : undefined}
      />
    );
  }

  const mySide: 'left' | 'right' = profile.side ?? 'left';
  const left = mySide === 'left' ? profile : partner;
  const right = mySide === 'left' ? partner : profile;

  return (
    <div className="screen vs-screen">
      <div className="vs-bg" aria-hidden="true" />
      <div className="topbar">
        {!MVP_MODE ? (
          <div className="chips">
            <span className="chip iron"><span className="dot" />{profile.iron} IRON</span>
            <span className="chip grit"><span className="dot" />{profile.grit} GRIT</span>
            <RestTokens count={profile.rest_tokens} />
          </div>
        ) : (
          <div className="chips">
            <span className="chip">{profile.days_trained} days trained</span>
          </div>
        )}
        <div className="row" style={{ gap: 8, marginLeft: 'auto' }}>
          {onSchedule && (
            <Link className="back" href="/schedule">
              Schedule
            </Link>
          )}
          <button className="back" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>

      {!MVP_MODE && <ProModeHeader level={profile.pro_mode_level} onPress={pressProMode} />}

      {left && right && left.streak_last_date === TODAY && right.streak_last_date === TODAY && (
        <div className="both-today">BOTH BROS IN TODAY</div>
      )}

      <div className="vs">
        <div className="days-trained">
          <div className="num">{profile.days_trained}</div>
          <div className="lbl">DAYS TRAINED</div>
        </div>

        {left ? (
          <Fighter
            p={left}
            opponentIron={MVP_MODE ? null : (right?.iron ?? null)}
            onSelect={!MVP_MODE && onLocker && left === profile ? onLocker : undefined}
          />
        ) : (
          <WaitingSide />
        )}
        <div className="vs-mark" aria-hidden="true">
          VS
        </div>
        {right ? (
          <Fighter
            p={right}
            opponentIron={MVP_MODE ? null : (left?.iron ?? null)}
            onSelect={!MVP_MODE && onLocker && right === profile ? onLocker : undefined}
          />
        ) : (
          <WaitingSide />
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block btn-train-nothing"
        onClick={onTrain}
        aria-label="Train"
      >
        TRAIN
      </button>
    </div>
  );
}

function WaitingSide() {
  return (
    <div className="empty-side">
      <div className="fighter-figure" style={{ opacity: 0.3 }}>
        <Avatar tier={1} side="right" />
      </div>
      <div className="tiny">waiting for bro</div>
    </div>
  );
}
