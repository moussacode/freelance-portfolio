'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { CONTENT_TAG } from '@/lib/cache-tags';
import { checkCompleteList } from '@/lib/list-guard';
import { faqSchema } from '@/lib/validation';
import type { SaveListResult } from '@/components/admin/CollectionEditor';
import { FAQ_COLUMNS, faqFromRow, faqToInput, type FaqDraft, type FaqRow } from './shared';

const payload = z.object({
  items: z.array(faqSchema.extend({ id: z.uuid().nullable() })).max(40),
  deleted: z.array(z.uuid()).max(40),
});

/** Enregistre toutes les questions en un seul lot (fonction SQL freelance_save_faq : tout ou rien). */
export async function saveFaq(items: FaqDraft[], deleted: string[]): Promise<SaveListResult<FaqDraft>> {
  const { supabase } = await requireAdmin();
  const parsed = payload.safeParse({ items: items.map(faqToInput), deleted });
  if (!parsed.success) return { ok: false, error: 'Une question contient une erreur. Ouvrez-la pour la corriger.' };

  const slugs = parsed.data.items.map((i) => i.slug);
  if (new Set(slugs).size !== slugs.length) return { ok: false, error: 'Deux questions ont la même adresse.' };

  // La liste doit être complète : les positions sont recalculées pour tous les éléments.
  const incomplete = await checkCompleteList(
    supabase,
    'freelance_faq',
    parsed.data.items.map((i) => i.id),
    parsed.data.deleted,
  );
  if (incomplete) return { ok: false, error: incomplete };

  const { error } = await supabase.rpc('freelance_save_faq', { items: parsed.data.items, deleted: parsed.data.deleted });
  if (error) {
    const missing = error.code === '42883' || error.code === 'PGRST202';
    return {
      ok: false,
      error: missing
        ? 'La base n’est pas à jour : exécutez supabase/freelance-admin-2.sql dans Supabase.'
        : error.code === '23505'
          ? 'Deux questions ont la même adresse. Reformulez l’une des deux.'
          : 'Enregistrement impossible. Rien n’a été modifié sur le site.',
    };
  }

  updateTag(CONTENT_TAG);
  revalidatePath('/admin', 'layout');

  const { data } = await supabase.from('freelance_faq').select(FAQ_COLUMNS).order('position');
  return { ok: true, items: ((data ?? []) as FaqRow[]).map(faqFromRow) };
}
