import { redirect } from 'next/navigation';

export default function DietPage() {
  redirect('/details?tab=diet');
}
