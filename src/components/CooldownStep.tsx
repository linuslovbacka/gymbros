'use client';

import {
  COOLDOWN_STEP,
  cooldownSections,
  type CooldownVariant,
} from '@/content/mobility';

export function CooldownStep({
  variant,
  onBack,
  onSkip,
  onComplete,
}: {
  variant: CooldownVariant;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
}) {
  const sections = cooldownSections(variant);

  return (
    <div className="screen">
      <div className="topbar">
        <button type="button" className="back" onClick={onBack}>
          ← Back
        </button>
        <span className="tiny">{COOLDOWN_STEP.title}</span>
        <span style={{ width: 48 }} />
      </div>

      <p className="muted">{COOLDOWN_STEP.intro}</p>

      {sections.map((section) => (
        <div key={section.title} className="mobility-guide-block">
          <h3 className="diet-card-title">{section.title}</h3>
          <ul className="schedule-list">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <div className="spacer" />
      <button type="button" className="btn btn-primary btn-block" onClick={onComplete}>
        {COOLDOWN_STEP.doneLabel}
      </button>
      <button type="button" className="btn btn-block" onClick={onSkip}>
        {COOLDOWN_STEP.skipLabel}
      </button>
    </div>
  );
}
