import { requireAdmin } from '@/lib/auth';
import { ANALYTICS_URL, getVisits } from '@/lib/analytics';
import { VisitsView } from './VisitsView';

/**
 * Carte « Visites » de la vue d'ensemble (composant serveur, chargé à part dans un Suspense).
 * requireAdmin() d'abord, puis l'API Vercel (token côté serveur) ; si elle échoue : « Statistiques indisponibles ».
 */
export async function VisitsCard() {
  await requireAdmin();
  const visits = await getVisits();
  return <VisitsView visits={visits} analyticsUrl={ANALYTICS_URL} />;
}
