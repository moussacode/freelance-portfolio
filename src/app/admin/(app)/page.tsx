import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { person } from '@/content/site';
import { NewButton, PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata: Metadata = { title: 'Vue d’ensemble' };

/** Vue d'ensemble : contenu réel à l'étape 10. */
export default async function AdminHome() {
  await requireAdmin();
  return (
    <>
      <PageHeader eyebrow={`Bonjour ${person.name.split(' ')[0]}`} title="Vue d’ensemble">
        <NewButton />
      </PageHeader>
      <EmptyState
        title="Le tableau de bord arrive bientôt"
        text="Contenu en ligne, éléments à finir et dernières modifications : à l’étape 10."
      />
    </>
  );
}
