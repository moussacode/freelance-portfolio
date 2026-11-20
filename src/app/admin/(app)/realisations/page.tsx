import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { WorksEditor } from './WorksEditor';
import { WORK_COLUMNS, workFromRow, type WorkRow } from './shared';

export const metadata: Metadata = { title: 'Réalisations' };

export default async function WorksPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('freelance_works').select(WORK_COLUMNS).order('position');
  if (error) throw new Error('Réalisations introuvables.');
  return <WorksEditor initial={((data ?? []) as WorkRow[]).map(workFromRow)} />;
}
