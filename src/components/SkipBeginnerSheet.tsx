'use client';

import { BEGINNER_ONBOARDING } from '@/content/workouts';

export function SkipBeginnerSheet({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-name">{BEGINNER_ONBOARDING.skipConfirmTitle}</div>
        <p className="sheet-desc">{BEGINNER_ONBOARDING.skipConfirmBody}</p>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {BEGINNER_ONBOARDING.skipLabel}
        </button>
        <button type="button" className="btn btn-block" onClick={onClose}>
          Keep ramp
        </button>
      </div>
    </div>
  );
}
