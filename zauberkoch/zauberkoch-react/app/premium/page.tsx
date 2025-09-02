import { Metadata } from 'next';
import PremiumView from '@/components/premium/PremiumView';

export const metadata: Metadata = {
  title: 'Premium - ZauberKoch',
  description: 'Upgrade zu ZauberKoch Premium und generiere unbegrenzt viele personalisierte Rezepte mit künstlicher Intelligenz. Keine Limits, alle Features.',
};

export default function PremiumPage() {
  return <PremiumView />;
}