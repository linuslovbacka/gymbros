'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProteinAlternativesSheet } from '@/components/ProteinAlternativesSheet';
import { useApp } from '@/state/store';
import {
  CREATINE_GUIDE,
  DIET_RESTRICTIONS,
  PERFORMANCE_BULK_PROTEIN,
  dietGoals,
  HAND_RULE_PORTIONS,
  proteinTargetG,
  SICK_DAY_TRAINING_NOTE,
} from '@/content/diet';
import { DietMetricsCalculator } from '@/components/DietMetricsCalculator';
import { habitScore } from '@/lib/habits-score';

const TODAY = () => new Date().toISOString().slice(0, 10);

export function DietScreen() {
  const { profile, habitsToday, setMaintenanceMode } = useApp();
  const [proteinGuideOpen, setProteinGuideOpen] = useState(false);
  if (!profile) return null;

  const proteinTarget = proteinTargetG(profile);
  const goals = dietGoals(proteinTarget);
  const today = habitsToday ?? {
    no_sugar: false,
    protein_met: false,
    protein_g: 0,
    water_met: false,
    steps_met: false,
    creatine_met: false,
    sick: false,
  };
  const trained = profile.streak_last_date === TODAY();
  const { done, total } = habitScore(today, trained);
  const performanceBulk = profile.maintenance_mode ?? false;

  return (
    <div className="screen">
      <div className="topbar">
        <Link className="back" href="/">
          Back
        </Link>
        <div className="topbar-title">Diet</div>
      </div>

      <section className="stack diet-section">
        <h2 className="section-title">Today</h2>
        <p className="muted diet-lead">
          Habits score <strong>{done}/{total}</strong>
          {today.sick && ' — training excused while sick.'}
        </p>
      </section>

      <section className="stack diet-section">
        <h2 className="section-title">{PERFORMANCE_BULK_PROTEIN.sectionTitle}</h2>
        <button
          type="button"
          className={`btn btn-block diet-mode-btn${performanceBulk ? ' btn-primary' : ''}`}
          onClick={() => setMaintenanceMode(!performanceBulk)}
        >
          {performanceBulk ? PERFORMANCE_BULK_PROTEIN.toggleOn : PERFORMANCE_BULK_PROTEIN.toggleOff}
        </button>
        <p className="tiny muted diet-lead">{PERFORMANCE_BULK_PROTEIN.hint}</p>
      </section>

      <section className="stack diet-section">
        <h2 className="section-title">Restrictions</h2>
        <ul className="diet-list">
          {DIET_RESTRICTIONS.map((r) => (
            <li key={r.id} className="diet-card">
              <div className="diet-card-head">
                <span className="diet-card-title">{r.title}</span>
                {r.id === 'no_sugar' && (
                  <span className={`diet-today-pill ${today.no_sugar ? 'done' : ''}`}>
                    {today.no_sugar ? 'On track' : 'Open'}
                  </span>
                )}
              </div>
              <p className="diet-card-detail muted">{r.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="stack diet-section">
        <h2 className="section-title">Protein & BMI</h2>
        <p className="muted diet-lead">
          Set weight and height to calculate your daily protein target and BMI. Log food on home.
        </p>
        <button
          type="button"
          className="btn btn-block diet-protein-guide-btn"
          onClick={() => setProteinGuideOpen(true)}
        >
          Protein alternatives & fist portions
        </button>
        <DietMetricsCalculator profile={profile} />
      </section>

      <ProteinAlternativesSheet open={proteinGuideOpen} onClose={() => setProteinGuideOpen(false)} />

      <section className="stack diet-section">
        <h2 className="section-title">{CREATINE_GUIDE.title}</h2>
        <div className="diet-card">
          <div className="diet-card-head">
            <span className="diet-card-title">Daily dose</span>
            <span className="diet-target">{CREATINE_GUIDE.targetLabel}</span>
          </div>
          <p className="diet-card-detail">{CREATINE_GUIDE.summary}</p>
          <ul className="diet-creatine-list muted">
            {CREATINE_GUIDE.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="stack diet-section">
        <h2 className="section-title">Other goals</h2>
        <ul className="diet-list">
          {goals
            .filter((g) => g.id !== 'protein')
            .map((g) => (
              <li key={g.id} className="diet-card">
                <div className="diet-card-head">
                  <span className="diet-card-title">{g.title}</span>
                  {g.targetLabel && <span className="diet-target">{g.targetLabel}</span>}
                </div>
                <p className="diet-card-detail muted">{g.detail}</p>
                {g.id === 'water' && (
                  <span className={`diet-today-pill ${today.water_met ? 'done' : ''}`}>
                    {today.water_met ? 'Hit today' : 'Open'}
                  </span>
                )}
              </li>
            ))}
        </ul>
      </section>

      <section className="stack diet-section">
        <h2 className="section-title">Hand rule (portions)</h2>
        <p className="muted diet-lead">No scale needed — size portions to your hand.</p>
        <ul className="diet-list">
          {HAND_RULE_PORTIONS.map((p) => (
            <li key={p.id} className="diet-card">
              <div className="diet-card-head">
                <span className="diet-card-title">{p.title}</span>
                <span className="diet-target">{p.measure}</span>
              </div>
              <p className="diet-card-detail muted">{p.examples}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="tiny muted diet-foot">{SICK_DAY_TRAINING_NOTE}</p>
    </div>
  );
}
