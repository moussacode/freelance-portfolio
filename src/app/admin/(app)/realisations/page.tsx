import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata: Metadata = { title: 'Réalisations' };

/** Page provisoire : la gestion arrive à l'étape 9. */
export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader eyebrow="Projets montrés sur le site" title="Réalisations" />
      <EmptyState title="Bientôt ici" text="Cette page arrive à l’étape 9." />
    </>
  );
}
