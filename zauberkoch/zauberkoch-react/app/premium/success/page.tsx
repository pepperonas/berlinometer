import { Metadata } from 'next';
import PremiumSuccessView from '@/components/premium/PremiumSuccessView';

export const metadata: Metadata = {
  title: 'Premium Aktiviert - ZauberKoch',
  description: 'Herzlichen Glückwunsch! Dein ZauberKoch Premium-Abonnement wurde erfolgreich aktiviert. Entdecke jetzt alle Premium-Features.',
};

export default function PremiumSuccessPage() {
  return <PremiumSuccessView />;
}