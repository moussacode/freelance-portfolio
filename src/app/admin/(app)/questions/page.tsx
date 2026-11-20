import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';

export const metadata: Metadata = { title: 'Questions' };

/** Page provisoire : la gestion arrive à l'étape 8. */
export default async function Page() {
  await requireAdmin();
  return (
    <>
      <PageHeader eyebrow="Questions fréquentes du site" title="Questions" />
      <EmptyState title="Bientôt ici" text="Cette page arrive à l’étape 8." />
    </>
  );
}
