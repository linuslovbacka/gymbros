'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProteinAlternativesSheet } from '@/components/ProteinAlternativesSheet';
import { useApp } from '@/state/store';
import {
  CREATINE_GUIDE,
  DIET_HABITS_WHY_LEAD,
  DIET_PROGRAM_TIPS,
  DIET_RESTRICTIONS,
  PERFORMANCE_BULK_PROTEIN,
  dietGoals,
  HAND_RULE_PORTIONS,
  kcalTargetKcal,
  proteinTargetG,
  SICK_DAY_TRAINING_NOTE,
} from '@/content/diet';
import { DietMetricsCalculator } from '@/components/DietMetricsCalculator';
import { habitScore } from '@/lib/habits-score';

const TODAY = () => new Date().toISOString().slice(0, 10);

export function DietScreen({
  embedded = false,
  variant = 'default',
}: {
  embedded?: boolean;
  variant?: 'default' | 'llplay';
}) {
  const { profile, habitsToday, setMaintenanceMode } = useApp();
  const [proteinGuideOpen, setProteinGuideOpen] = useState(false);
  if (!profile) return null;

  const proteinTarget = proteinTargetG(profile);
  const kcalTarget = kcalTargetKcal(profile);
  const goals = dietGoals(proteinTarget, kcalTarget);
  const today = habitsToday ?? {
    no_sugar: false,
    protein_met: false,
    protein_g: 0,
    calories_met: false,
    calories_kcal: 0,
    water_met: false,
    steps_met: false,
    sleep_met: false,
    creatine_met: false,
    mobility_met: false,
    sick: false,
  };
  const trained = profile.streak_last_date === TODAY();
  const { done, total } = habitScore(today, trained);
  const performanceBulk = profile.maintenance_mode ?? false;

  if (embedded && variant === 'llplay') {
    const otherGoals = goals.filter((g) => g.id !== 'protein' && g.id !== 'calories' && g.id !== 'water');
    const waterGoal = goals.find((g) => g.id === 'water');

    return (
      <div className="llplay-details-pane llplay-details-pane--diet">
        <div className="llplay-details-general">
          <h2 className="llplay-details-general-title">general</h2>
          <p className="llplay-details-general-lead">{DIET_HABITS_WHY_LEAD}</p>
          <p className="llplay-details-general-meta">
            Habits score <strong>{done}/{total}</strong>
            {today.sick && ' — training excused while sick.'}
          </p>
        </div>

        <div className="llplay-details-performance">
          <button
            type="button"
            className={`llplay-details-performance-btn llplay-card${performanceBulk ? ' is-on' : ''}`}
            data-llplay-card
            onClick={() => setMaintenanceMode(!performanceBulk)}
          >
            {performanceBulk ? PERFORMANCE_BULK_PROTEIN.toggleOn : PERFORMANCE_BULK_PROTEIN.toggleOff}
          </button>
          <p className="llplay-details-performance-hint">{PERFORMANCE_BULK_PROTEIN.hint}</p>
        </div>

        <div className="llplay-details-card">
          <div className="llplay-details-card-intro">
            <h3 className="llplay-details-card-title">Protein &amp; BMI</h3>
            <p className="llplay-details-card-intro-lead">
              Set weight and height to calculate your daily protein target and BMI.
            </p>
          </div>
          <DietMetricsCalculator profile={profile} variant="llplay" />
          <button
            type="button"
            className="llplay-details-link-btn llplay-card"
            data-llplay-card
            onClick={() => setProteinGuideOpen(true)}
          >
            Protein alternatives &amp; fist portions
          </button>
        </div>

        <ProteinAlternativesSheet open={proteinGuideOpen} onClose={() => setProteinGuideOpen(false)} />

        <div className="llplay-details-card">
          <h3 className="llplay-details-card-title">Restrictions</h3>
          {DIET_RESTRICTIONS.map((r) => (
            <div key={r.id} className="llplay-details-row">
              <div className="llplay-details-row-head">
                <p className="llplay-details-row-title">{r.title}</p>
                {r.id === 'no_sugar' && (
                  <span className={`llplay-details-pill${today.no_sugar ? ' is-done' : ''}`}>
                    {today.no_sugar ? 'On track' : 'Open'}
                  </span>
                )}
              </div>
              <p className="llplay-details-row-sub">{r.detail}</p>
            </div>
          ))}
        </div>

        <div className="llplay-details-card">
          <h3 className="llplay-details-card-title">Hand rule (portions)</h3>
          <p className="llplay-details-card-intro-lead llplay-details-card-intro-lead--center">
            No scale needed — size portions to your hand.
          </p>
          {HAND_RULE_PORTIONS.map((p) => (
            <div key={p.id} className="llplay-details-row">
              <div className="llplay-details-row-split">
                <span className="llplay-details-row-title">{p.title}</span>
                <span className="llplay-details-row-title">{p.measure}</span>
              </div>
              <p className="llplay-details-row-sub">{p.examples}</p>
            </div>
          ))}
        </div>

        <div className="llplay-details-card">
          <div className="llplay-details-row-split llplay-details-row-split--creatine">
            <span className="llplay-details-row-title">{CREATINE_GUIDE.title}</span>
            <span className="llplay-details-row-title">{CREATINE_GUIDE.targetLabel}</span>
          </div>
          <p className="llplay-details-row-sub">{CREATINE_GUIDE.summary}</p>
          <ul className="llplay-details-list">
            {CREATINE_GUIDE.bullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {waterGoal && (
          <div className="llplay-details-card">
            <div className="llplay-details-row-split">
              <span className="llplay-details-row-title">{waterGoal.title}</span>
              <span className="llplay-details-row-title">{waterGoal.targetLabel}</span>
            </div>
            <p className="llplay-details-row-sub">{waterGoal.detail}</p>
            <span className={`llplay-details-pill llplay-details-pill--inline${today.water_met ? ' is-done' : ''}`}>
              {today.water_met ? 'Hit today' : 'Open'}
            </span>
          </div>
        )}

        <div className="llplay-details-card">
          <h3 className="llplay-details-card-title">{DIET_PROGRAM_TIPS.title}</h3>
          <ul className="llplay-details-list">
            {DIET_PROGRAM_TIPS.items.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        {otherGoals.length > 0 && (
          <div className="llplay-details-card">
            <h3 className="llplay-details-card-title">Other goals</h3>
            {otherGoals.map((g) => (
              <div key={g.id} className="llplay-details-row">
                <div className="llplay-details-row-head">
                  <p className="llplay-details-row-title">{g.title}</p>
                  {g.targetLabel && <span className="llplay-details-pill">{g.targetLabel}</span>}
                </div>
                <p className="llplay-details-row-detail">{g.detail}</p>
              </div>
            ))}
          </div>
        )}

        <p className="llplay-details-foot">{SICK_DAY_TRAINING_NOTE}</p>
      </div>
    );
  }

  return (
    <div className={embedded ? 'llplay-details-pane' : 'screen'}>
      {!embedded && (
        <div className="topbar">
          <Link className="back" href="/">
            Back
          </Link>
          <div className="topbar-title">Diet</div>
        </div>
      )}

      <section className="stack diet-section">
        <h2 className="section-title">Today</h2>
        <p className="muted diet-lead">{DIET_HABITS_WHY_LEAD}</p>
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
        <h2 className="section-title">{DIET_PROGRAM_TIPS.title}</h2>
        <ul className="diet-creatine-list muted">
          {DIET_PROGRAM_TIPS.items.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="stack diet-section">
        <h2 className="section-title">Other goals</h2>
        <ul className="diet-list">
          {goals
            .filter((g) => g.id !== 'protein' && g.id !== 'calories')
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
