'use client';

import { useState } from 'react';
import { proteinTargetG } from '@/content/diet';
import { useApp } from '@/state/store';
import type { Profile } from '@/state/types';

const QUICK_ADD_G = [10, 20, 25, 30] as const;

export function ProteinLogPanel({
  profile,
  variant = 'full',
}: {
  profile: Profile;
  variant?: 'full' | 'home';
}) {
  const { habitsToday, addProteinGrams, resetProteinLog } = useApp();
  const target = proteinTargetG(profile);
  const logged = habitsToday?.protein_g ?? 0;
  const remaining = Math.max(0, target - logged);
  const met = habitsToday?.protein_met ?? false;
  const pct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;

  const [draft, setDraft] = useState('25');

  function addFromDraft() {
    const n = Number.parseInt(draft, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    void addProteinGrams(n);
  }

  const rootClass = variant === 'home' ? 'protein-log protein-log--home' : 'protein-calc';

  return (
    <div className={rootClass}>
      <div className={variant === 'home' ? 'protein-log-summary' : 'protein-calc-summary'}>
        {variant === 'home' && (
          <div className="protein-log-head">
            <span className={`protein-log-mark${met ? ' done' : ''}`} aria-hidden="true">
              {met ? '✓' : '○'}
            </span>
            <span className="protein-log-title">Add protein</span>
          </div>
        )}
        <div className="protein-calc-nums">
          <span className="protein-calc-logged">{logged}</span>
          <span className="protein-calc-slash muted">/</span>
          <span className="protein-calc-target">{target} g</span>
        </div>
        <p className={variant === 'home' ? 'protein-log-caption muted' : 'protein-calc-caption muted'}>
          {met
            ? 'Target hit for today.'
            : remaining > 0
              ? `${remaining} g to go`
              : 'Log grams as you eat.'}
        </p>
        <div className="protein-calc-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className="protein-calc-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={variant === 'home' ? 'protein-log-quick protein-calc-quick' : 'protein-calc-quick'}>
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
      </div>

      <div className="protein-calc-row">
        <input
          className="protein-calc-input"
          type="number"
          inputMode="numeric"
          min={1}
          max={999}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Grams to add"
        />
        <button type="button" className="btn btn-primary protein-calc-add-btn" onClick={addFromDraft}>
          Add g
        </button>
      </div>

      {logged > 0 && (
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
