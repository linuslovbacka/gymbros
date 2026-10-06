'use client';

import { useEffect } from 'react';
import { MOBILITY_GUIDE } from '@/content/mobility';

function Section({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="mobility-guide-block">
      <h3 className="diet-card-title">{title}</h3>
      <ul className="schedule-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function MobilityGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const g = MOBILITY_GUIDE;

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet diet-protein-sheet"
        role="dialog"
        aria-labelledby="mobility-guide-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head diet-protein-sheet-head">
          <div>
            <div className="sheet-name" id="mobility-guide-title">
              {g.sheetTitle}
            </div>
            <div className="sheet-meta">{g.sheetMeta}</div>
          </div>
        </div>
        <p className="sheet-desc">{g.intro}</p>

        <Section title={g.upper.cooldown.title} items={g.upper.cooldown.items} />
        <Section title={g.upper.betweenRounds.title} items={g.upper.betweenRounds.items} />
        <Section title={g.lower.cooldown.title} items={g.lower.cooldown.items} />
        <Section title={g.lower.betweenRounds.title} items={g.lower.betweenRounds.items} />

        <button type="button" className="btn btn-block" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
