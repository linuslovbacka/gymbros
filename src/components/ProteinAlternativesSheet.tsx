'use client';

import { useEffect } from 'react';
import { PROTEIN_ALTERNATIVES_GUIDE } from '@/content/diet';

export function ProteinAlternativesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const g = PROTEIN_ALTERNATIVES_GUIDE;

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet diet-protein-sheet"
        role="dialog"
        aria-labelledby="protein-alt-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head diet-protein-sheet-head">
          <div>
            <div className="sheet-name" id="protein-alt-title">
              {g.title}
            </div>
            <div className="sheet-meta">Fist portions → grams</div>
          </div>
        </div>
        <p className="sheet-desc">{g.intro}</p>

        <div className="diet-protein-fist-card">
          <div className="diet-card-head">
            <span className="diet-card-title">{g.fistRule.title}</span>
            <span className="diet-target">{g.fistRule.measure}</span>
          </div>
          <p className="diet-card-detail muted">{g.fistRule.volumeNote}</p>
          <p className="diet-protein-fist-grams">
            Lean meat / fish / firm tofu: <strong>{g.fistRule.leanMeatG}</strong>
          </p>
          <p className="diet-card-detail muted">{g.fistRule.leanMeatDetail}</p>
        </div>

        <ul className="diet-protein-alt-list">
          {g.alternatives.map((alt) => (
            <li key={alt.id} className="diet-protein-alt-row">
              <div className="diet-protein-alt-head">
                <span className="diet-protein-alt-name">{alt.name}</span>
                <span className="diet-protein-alt-g">{alt.fistProteinG}</span>
              </div>
              <p className="diet-protein-alt-detail muted">{alt.detail}</p>
            </li>
          ))}
        </ul>

        <p className="tiny muted diet-protein-palm-note">{g.palmNote}</p>

        <button type="button" className="btn btn-block" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
