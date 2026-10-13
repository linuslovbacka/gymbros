import { redirect } from 'next/navigation';

export default function SchedulePage() {
  redirect('/details?tab=schedule');
}
