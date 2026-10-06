'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  bmiCategory,
  bmiFromMetrics,
  PERFORMANCE_BULK_PROTEIN,
  PERFORMANCE_BULK_PROTEIN_BONUS_G,
  proteinBaseFromWeightKg,
  PROTEIN_G_PER_KG,
  proteinTargetG,
} from '@/content/diet';
import { useApp } from '@/state/store';
import type { Profile } from '@/state/types';

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function hasSavedMetrics(profile: Profile): boolean {
  return (
    profile.body_weight_kg != null &&
    profile.body_weight_kg > 0 &&
    profile.body_height_cm != null &&
    profile.body_height_cm > 0
  );
}

export function DietMetricsCalculator({ profile }: { profile: Profile }) {
  const { habitsToday, updateBodyMetrics } = useApp();
  const saved = hasSavedMetrics(profile);
  const [editing, setEditing] = useState(() => !saved);

  const [weight, setWeight] = useState(() =>
    profile.body_weight_kg != null ? String(profile.body_weight_kg) : '',
  );
  const [height, setHeight] = useState(() =>
    profile.body_height_cm != null ? String(profile.body_height_cm) : '',
  );

  useEffect(() => {
    if (saved && !editing) {
      setWeight(profile.body_weight_kg != null ? String(profile.body_weight_kg) : '');
      setHeight(profile.body_height_cm != null ? String(profile.body_height_cm) : '');
    }
  }, [profile.body_weight_kg, profile.body_height_cm, saved, editing]);

  const displayWeightKg = editing
    ? Number.parseFloat(weight)
    : (profile.body_weight_kg ?? NaN);
  const displayHeightCm = editing
    ? Number.parseFloat(height)
    : (profile.body_height_cm ?? NaN);

  const validWeight = Number.isFinite(displayWeightKg) && displayWeightKg > 0;
  const validHeight = Number.isFinite(displayHeightCm) && displayHeightCm > 0;

  const bmi = useMemo(
    () => (validWeight && validHeight ? bmiFromMetrics(displayWeightKg, displayHeightCm) : null),
    [validWeight, validHeight, displayWeightKg, displayHeightCm],
  );
  const bmiInfo = bmi != null ? bmiCategory(bmi) : null;

  const performanceBulk = profile.maintenance_mode ?? false;
  const baseProtein = validWeight ? proteinBaseFromWeightKg(displayWeightKg) : null;
  const effectiveTarget =
    saved && !editing
      ? proteinTargetG(profile)
      : baseProtein != null
        ? baseProtein + (performanceBulk ? PERFORMANCE_BULK_PROTEIN_BONUS_G : 0)
        : proteinTargetG(profile);
  const logged = habitsToday?.protein_g ?? 0;

  const draftWeight = Number.parseFloat(weight);
  const draftHeight = Number.parseFloat(height);
  const canSave =
    Number.isFinite(draftWeight) &&
    draftWeight > 0 &&
    Number.isFinite(draftHeight) &&
    draftHeight > 0;

  function saveMetrics() {
    if (!canSave) return;
    updateBodyMetrics({ body_weight_kg: draftWeight, body_height_cm: draftHeight });
    setEditing(false);
  }

  function cancelEdit() {
    setWeight(profile.body_weight_kg != null ? String(profile.body_weight_kg) : '');
    setHeight(profile.body_height_cm != null ? String(profile.body_height_cm) : '');
    setEditing(false);
  }

  return (
    <div className="diet-metrics">
      {saved && !editing ? (
        <div className="diet-metrics-saved-row">
          <span className="diet-metrics-saved-text">
            {fmt(profile.body_weight_kg!)} kg · {fmt(profile.body_height_cm!)} cm
          </span>
          <button type="button" className="diet-metrics-edit" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
      ) : (
        <>
          <div className="diet-metrics-fields">
            <label className="diet-metrics-field">
              <span className="diet-metrics-label">Weight (kg)</span>
              <input
                className="diet-metrics-input"
                type="number"
                inputMode="decimal"
                min={1}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
            <label className="diet-metrics-field">
              <span className="diet-metrics-label">Height (cm)</span>
              <input
                className="diet-metrics-input"
                type="number"
                inputMode="decimal"
                min={1}
                step={0.1}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </label>
          </div>

          <div className="diet-metrics-actions">
            {saved && (
              <button type="button" className="diet-metrics-edit" onClick={cancelEdit}>
                Cancel
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary diet-metrics-save"
              disabled={!canSave}
              onClick={saveMetrics}
            >
              Save & update protein target
            </button>
          </div>
        </>
      )}

      {bmi != null && bmiInfo && (
        <div className="diet-metrics-card">
          <div className="diet-metrics-card-head">
            <span className="diet-metrics-card-title">BMI</span>
            <span className="diet-metrics-card-value">{fmt(bmi)}</span>
          </div>
          <p className="diet-metrics-card-sub">
            <strong>{bmiInfo.label}</strong> — {bmiInfo.detail}
          </p>
        </div>
      )}

      <div className="diet-metrics-card">
        <div className="diet-metrics-card-head">
          <span className="diet-metrics-card-title">Protein target</span>
          <span className="diet-metrics-card-value">{effectiveTarget} g</span>
        </div>
        {baseProtein != null && validWeight ? (
          <p className="diet-metrics-card-sub muted">
            {PROTEIN_G_PER_KG} g × {fmt(displayWeightKg)} kg ≈ {baseProtein} g base
            {performanceBulk
              ? ` · +${PERFORMANCE_BULK_PROTEIN_BONUS_G} g ${PERFORMANCE_BULK_PROTEIN.bonusLabel}`
              : ''}. Log grams on home.
          </p>
        ) : (
          <p className="diet-metrics-card-sub muted">
            Enter weight and height, then save. Default target is used until then.
          </p>
        )}
        {logged > 0 && (
          <p className="diet-metrics-card-sub muted">Today logged: {logged} g (home).</p>
        )}
      </div>
    </div>
  );
}
