import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { TestimonialsEditor } from './TestimonialsEditor';
import { TESTIMONIAL_COLUMNS, testimonialFromRow, type TestimonialRow } from './shared';

export const metadata: Metadata = { title: 'Avis' };

export default async function TestimonialsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from('freelance_testimonials').select(TESTIMONIAL_COLUMNS).order('position');
  if (error) throw new Error('Avis introuvables.');
  return <TestimonialsEditor initial={((data ?? []) as TestimonialRow[]).map(testimonialFromRow)} />;
}
