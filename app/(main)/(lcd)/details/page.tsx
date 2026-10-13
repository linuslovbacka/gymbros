'use client';

import { DetailsScreen } from '@/screens/DetailsScreen';
import { MVP_MODE } from '@/lib/mvp';

export default function DetailsPage() {
  if (MVP_MODE) return null;
  return <DetailsScreen />;
}
