import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { ServicesEditor } from './ServicesEditor';
import { SERVICE_COLUMNS, serviceFromRow, type ServiceRow } from './shared';

export const metadata: Metadata = { title: 'Services' };

export default async function ServicesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('freelance_services').select(SERVICE_COLUMNS).order('position');
  if (error) throw new Error('Services introuvables.');
  return <ServicesEditor initial={((data ?? []) as ServiceRow[]).map(serviceFromRow)} />;
}
