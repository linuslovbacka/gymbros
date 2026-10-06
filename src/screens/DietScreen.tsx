'use client';

import Link from 'next/link';
import { useApp } from '@/state/store';
import {
  DIET_RESTRICTIONS,
  dietGoals,
  HAND_RULE_PORTIONS,
  proteinTargetG,
  SICK_DAY_TRAINING_NOTE,
} from '@/content/diet';
import { habitScore } from '@/lib/habits-score';

const TODAY = () => new Date().toISOString().slice(0, 10);

export function DietScreen() {
  const { profile, habitsToday, setMaintenanceMode } = useApp();
  if (!profile) return null;

  const proteinTarget = proteinTargetG(profile);
  const goals = dietGoals(proteinTarget);
  const today = habitsToday ?? { no_sugar: false, protein_met: false, water_met: false, sick: false };
  const trained = profile.streak_last_date === TODAY();
  const { done, total } = habitScore(today, trained);
  const maintenance = profile.maintenance_mode ?? false;

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
        <h2 className="section-title">Goal mode</h2>
        <button
          type="button"
          className={`btn btn-block diet-mode-btn${maintenance ? ' btn-primary' : ''}`}
          onClick={() => setMaintenanceMode(!maintenance)}
        >
          {maintenance ? 'Maintenance / performance (+protein)' : 'Switch to maintenance (+protein target)'}
        </button>
        <p className="tiny muted diet-lead">
          Use maintenance if you are not trying to cut hard — bumps your protein target slightly.
        </p>
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
        <h2 className="section-title">Goals</h2>
        <ul className="diet-list">
          {goals.map((g) => (
            <li key={g.id} className="diet-card">
              <div className="diet-card-head">
                <span className="diet-card-title">{g.title}</span>
                {g.targetLabel && <span className="diet-target">{g.targetLabel}</span>}
              </div>
              <p className="diet-card-detail muted">{g.detail}</p>
              {g.id === 'protein' && (
                <span className={`diet-today-pill ${today.protein_met ? 'done' : ''}`}>
                  {today.protein_met ? 'Hit today' : 'Open'}
                </span>
              )}
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
