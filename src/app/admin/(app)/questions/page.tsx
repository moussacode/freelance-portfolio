import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { QuestionsEditor } from './QuestionsEditor';
import { FAQ_COLUMNS, faqFromRow, type FaqRow } from './shared';

export const metadata: Metadata = { title: 'Questions' };

export default async function QuestionsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('freelance_faq').select(FAQ_COLUMNS).order('position');
  if (error) throw new Error('Questions introuvables.');
  return <QuestionsEditor initial={((data ?? []) as FaqRow[]).map(faqFromRow)} />;
}
