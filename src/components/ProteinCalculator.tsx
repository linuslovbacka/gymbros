'use client';

import type { Profile } from '@/state/types';
import { ProteinLogPanel } from '@/components/ProteinLogPanel';

export function ProteinCalculator({ profile }: { profile: Profile }) {
  return <ProteinLogPanel profile={profile} variant="full" />;
}
