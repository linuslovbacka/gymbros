'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { proteinTargetG } from '@/content/diet';
import { useApp } from '@/state/store';
import type { Profile } from '@/state/types';

const QUICK_ADD_G = [10, 20, 30] as const;

function useLlplayQuickAddFit(actionsRef: React.RefObject<HTMLDivElement | null>, deps: unknown[]) {
  useLayoutEffect(() => {
    const row = actionsRef.current;
    if (!row) return;

    function fitQuickAdds() {
      const row = actionsRef.current;
      if (!row) return;
      const quickGroup = row.querySelector<HTMLElement>('.protein-llplay-quick-group');
      const custom = row.querySelector<HTMLElement>('.protein-llplay-custom');
      if (!quickGroup || !custom) return;

      const chips = [...quickGroup.querySelectorAll<HTMLElement>('[data-quick]')].sort(
        (a, b) => Number(b.dataset.quick) - Number(a.dataset.quick),
      );
      for (const chip of chips) {
        chip.style.display = '';
      }
      const gap = 4;
      for (const chip of chips) {
        const used = quickGroup.scrollWidth + custom.offsetWidth + gap;
        if (used <= row.clientWidth + 1) break;
        chip.style.display = 'none';
      }
    }

    fitQuickAdds();
    const ro = new ResizeObserver(fitQuickAdds);
    ro.observe(row);
    return () => ro.disconnect();
  }, deps);
}

function ProteinLogPanelLlplay({
  target,
  logged,
  met,
  gramsInput,
  setGramsInput,
  addFromPicker,
  addProteinGrams,
}: {
  target: number;
  logged: number;
  met: boolean;
  gramsInput: string;
  setGramsInput: (v: string) => void;
  addFromPicker: () => void;
  addProteinGrams: (g: number) => void | Promise<void>;
}) {
  const actionsRef = useRef<HTMLDivElement>(null);
  useLlplayQuickAddFit(actionsRef, [gramsInput, target, logged]);

  const belowGoal = target > 0 && logged < target;
  const loggedClass = belowGoal ? 'protein-llplay-logged is-below-goal' : 'protein-llplay-logged';

  return (
    <div
      className={`protein-log protein-log--llplay llplay-card${met ? ' protein-log--done' : ''}`}
      data-llplay-card
      tabIndex={0}
    >
      {met ? (
        <span className="daily-check-llplay-dot" aria-hidden="true" data-done="true" />
      ) : (
        <span className="protein-llplay-dot protein-llplay-dot--open" aria-hidden="true" />
      )}
      <div className="protein-llplay-body">
        <div className="protein-llplay-head">
          <span className="protein-llplay-title">Protein</span>
          <p className="protein-llplay-nums" aria-live="polite">
            <span className={loggedClass}>{logged}</span>
            <span className="protein-llplay-target">/{target}g</span>
          </p>
        </div>
        <div className="protein-llplay-actions" ref={actionsRef}>
          <div className="protein-llplay-quick-group">
            {QUICK_ADD_G.map((g) => (
              <button
                key={g}
                type="button"
                data-quick={g}
                className="protein-llplay-chip nothing-press"
                onClick={() => void addProteinGrams(g)}
              >
                +{g}
              </button>
            ))}
          </div>
          <div className="protein-llplay-custom">
            <label className="protein-llplay-custom-field">
              <span className="protein-llplay-input-prefix" aria-hidden="true">
                +
              </span>
              <input
                className="protein-llplay-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={gramsInput}
                aria-label="Grams to add"
                onChange={(e) => setGramsInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onBlur={() => {
                  const g = Number.parseInt(gramsInput, 10);
                  if (!Number.isFinite(g) || g <= 0) setGramsInput('30');
                }}
              />
            </label>
            <button type="button" className="protein-llplay-add nothing-press" onClick={() => void addFromPicker()}>
              add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProteinLogPanel({
  profile,
  variant = 'full',
}: {
  profile: Profile;
  variant?: 'full' | 'home' | 'llplay';
}) {
  const isHome = variant === 'home';
  const { habitsToday, addProteinGrams, resetProteinLog } = useApp();
  const target = proteinTargetG(profile);
  const logged = habitsToday?.protein_g ?? 0;
  const met = habitsToday?.protein_met ?? false;
  const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;

  const [gramsInput, setGramsInput] = useState(variant === 'llplay' ? '30' : '25');

  async function addFromPicker() {
    const g = Number.parseInt(gramsInput, 10);
    if (!Number.isFinite(g) || g <= 0) return;
    await addProteinGrams(g);
  }

  if (variant === 'llplay') {
    return (
      <ProteinLogPanelLlplay
        target={target}
        logged={logged}
        met={met}
        gramsInput={gramsInput}
        setGramsInput={setGramsInput}
        addFromPicker={() => void addFromPicker()}
        addProteinGrams={addProteinGrams}
      />
    );
  }

  const rootClass = isHome ? `protein-log protein-log--home${met ? ' protein-log--done' : ''}` : 'protein-calc';

  return (
    <div className={rootClass}>
      <div className={isHome ? 'protein-log-summary' : 'protein-calc-summary'}>
        {isHome && (
          <div className="protein-log-head">
            <div className="protein-log-head-main">
              <span className={`daily-check-mark protein-log-mark${met ? ' done' : ''}`} aria-hidden="true">
                {met ? '✓' : '○'}
              </span>
              <span className="protein-log-title">Add protein</span>
            </div>
            {logged > 0 && (
              <button
                type="button"
                className="protein-log-reset nothing-press"
                aria-label="Reset today's protein log"
                title="Reset today"
                onClick={() => void resetProteinLog()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 12a8 8 0 0 1 13.7-5.7M20 12a8 8 0 0 1-13.7 5.7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 4v5h5M20 20v-5h-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="protein-calc-nums" aria-live="polite">
          <span className="protein-calc-logged">{logged}</span>
          <span className="protein-calc-slash muted">/</span>
          <span className="protein-calc-target">{target} g</span>
        </div>
        {!isHome && met && (
          <p className="protein-calc-caption muted">Target hit for today.</p>
        )}
        <div className="protein-calc-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className="protein-calc-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={`protein-log-actions${isHome ? ' protein-log-actions--home' : ''}`}>
        {QUICK_ADD_G.map((g) => (
          <button
            key={g}
            type="button"
            className="protein-calc-chip nothing-press"
            onClick={() => void addProteinGrams(g)}
          >
            +{g}
          </button>
        ))}
        <div className="protein-gram-input-wrap">
          <input
            className="protein-gram-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={gramsInput}
            aria-label="Grams to add"
            onChange={(e) => setGramsInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onBlur={() => {
              const g = Number.parseInt(gramsInput, 10);
              if (!Number.isFinite(g) || g <= 0) setGramsInput('25');
            }}
          />
          <span className="protein-gram-unit" aria-hidden="true">
            g
          </span>
        </div>
        <button type="button" className="btn btn-primary protein-calc-add-btn" onClick={() => void addFromPicker()}>
          Add g
        </button>
      </div>

      {!isHome && logged > 0 && (
        <button type="button" className="btn protein-calc-reset" onClick={() => void resetProteinLog()}>
          Reset today
        </button>
      )}
    </div>
  );
}

/** Read-only summary for bro on home. */
export function ProteinLogSummary({
  logged,
  target,
  met,
}: {
  logged: number;
  target: number;
  met: boolean;
}) {
  return (
    <div className="daily-check readonly protein-log-readonly">
      <span className="daily-check-mark" aria-hidden="true">
        {met ? '✓' : '○'}
      </span>
      <span>
        <span className="daily-check-label">Protein</span>
        <span className="daily-check-sub muted">
          {logged} / {target} g logged
        </span>
      </span>
    </div>
  );
}
