import { FreelanceView } from '@/views/FreelanceView';

// ISR : la page est statique, régénérée au plus toutes les heures, ou dès que l'admin invalide
// le tag du contenu (revalidateTag / updateTag). Valeur littérale exigée par Next (= CONTENT_REVALIDATE).
export const revalidate = 3600;

export default function Home() {
  return <FreelanceView />;
}
