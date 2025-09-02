import { Metadata } from 'next';
import OfflineView from '@/components/offline/OfflineView';

export const metadata: Metadata = {
  title: 'Offline - ZauberKoch',
  description: 'ZauberKoch ist momentan offline. Nutze deine gespeicherten Rezepte oder warte, bis die Verbindung wieder hergestellt ist.',
};

export default function OfflinePage() {
  return <OfflineView />;
}