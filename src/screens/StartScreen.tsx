'use client';

import Link from 'next/link';
import { useApp } from '@/state/store';
import { Avatar, derivePhysiqueTier } from '@/components/Avatar';
import { AvatarStage } from '@/components/AvatarStage';
import { ProModeHeader } from '@/components/ProModeHeader';
import { DailyChecks } from '@/components/DailyChecks';
import { HabitTimeline } from '@/components/HabitTimeline';
import { useHabitHistory } from '@/hooks/useHabitHistory';
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
}: {
  onTrain: () => void;
  onLocker?: () => void;
  onSchedule?: () => void;
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
      <div className="screen start-mvp">
        <div className="topbar">
          <div className="chips">
            <span className="chip">{profile.days_trained} days trained</span>
          </div>
          <div className="row" style={{ gap: 8, marginLeft: 'auto' }}>
            <Link className="back" href="/diet">
              Diet
            </Link>
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

        <HabitTimeline
          days={historyDays}
          loading={historyLoading}
          compact
          hideLegend
          title="Your progress"
        />

        <DailyChecks partnerProfile={partner} />

        {sickToday ? (
          <p className="sick-train-note muted start-mvp-footer">
            Rest day — diet habits still count. Turn off &quot;I&apos;m sick&quot; when you&apos;re ready to train
            again.
          </p>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block btn-train-nothing start-mvp-footer"
            onClick={onTrain}
            aria-label="Train"
          >
            TRAIN
          </button>
        )}
      </div>
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
