'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { CONTENT_TAG } from '@/lib/cache-tags';
import { checkCompleteList } from '@/lib/list-guard';
import { testimonialSchema } from '@/lib/validation';
import type { SaveListResult } from '@/components/admin/CollectionEditor';
import {
  TESTIMONIAL_COLUMNS,
  testimonialFromRow,
  testimonialToInput,
  type TestimonialDraft,
  type TestimonialRow,
} from './shared';

// testimonialSchema refuse déjà un avis visible sans accord ; on y ajoute l'identifiant.
const item = z.intersection(testimonialSchema, z.object({ id: z.uuid().nullable() }));
const payload = z.object({ items: z.array(item).max(40), deleted: z.array(z.uuid()).max(40) });

/** Enregistre tous les avis en un seul lot (freelance_save_testimonials : tout ou rien). */
export async function saveTestimonials(
  items: TestimonialDraft[],
  deleted: string[],
): Promise<SaveListResult<TestimonialDraft>> {
  const { supabase } = await requireAdmin();
  const parsed = payload.safeParse({ items: items.map(testimonialToInput), deleted });
  if (!parsed.success) {
    const consent = parsed.error.issues.some((i) => i.path.at(-1) === 'visible');
    return {
      ok: false,
      error: consent
        ? 'Un avis visible n’a pas d’accord écrit coché. Rien n’a été modifié.'
        : 'Un avis contient une erreur. Ouvrez-le pour la corriger.',
    };
  }

  const incomplete = await checkCompleteList(supabase, 'freelance_testimonials', parsed.data.items.map((i) => i.id), parsed.data.deleted);
  if (incomplete) return { ok: false, error: incomplete };

  const { error } = await supabase.rpc('freelance_save_testimonials', {
    items: parsed.data.items,
    deleted: parsed.data.deleted,
  });
  if (error) {
    const missing = error.code === '42883' || error.code === 'PGRST202';
    return {
      ok: false,
      error: missing
        ? 'La base n’est pas à jour : exécutez supabase/freelance-admin-3.sql dans Supabase.'
        : error.code === '23514'
          ? 'Un avis visible n’a pas d’accord écrit. Rien n’a été modifié.'
          : 'Enregistrement impossible. Rien n’a été modifié sur le site.',
    };
  }

  updateTag(CONTENT_TAG);
  revalidatePath('/admin', 'layout');

  const { data } = await supabase.from('freelance_testimonials').select(TESTIMONIAL_COLUMNS).order('position');
  return { ok: true, items: ((data ?? []) as TestimonialRow[]).map(testimonialFromRow) };
}
