/** Glute day is only offered when `userId` matches env (Linus-only). */
export function canShowGluteRoutine(userId: string | undefined): boolean {
  if (!userId) return false;
  const allowed = process.env.NEXT_PUBLIC_PERSONAL_GLUTES_USER_ID?.trim();
  if (!allowed) return false;
  return userId === allowed;
}
