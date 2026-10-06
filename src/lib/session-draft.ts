import type { SessionDraft } from '@/screens/WorkoutScreen';

const KEY = 'gymbros.sessionDraft';

export function saveSessionDraft(draft: SessionDraft): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function loadSessionDraft(): SessionDraft | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionDraft;
  } catch {
    return null;
  }
}

export function clearSessionDraft(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
