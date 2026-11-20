import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata: Metadata = { title: 'Réglages' };

/** Page provisoire : la gestion arrive à l'étape 7. */
export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader eyebrow="Contact, profil et réseaux" title="Réglages" />
      <EmptyState title="Bientôt ici" text="Cette page arrive à l’étape 7." />
    </>
  );
}
