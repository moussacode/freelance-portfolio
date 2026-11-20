'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { CONTENT_TAG } from '@/lib/cache-tags';
import { checkCompleteList } from '@/lib/list-guard';
import { serviceSchema } from '@/lib/validation';
import type { SaveListResult } from '@/components/admin/CollectionEditor';
import { SERVICE_COLUMNS, serviceFromRow, serviceToInput, type ServiceDraft, type ServiceRow } from './shared';

const payload = z.object({
  items: z.array(serviceSchema.extend({ id: z.uuid().nullable() })).max(30),
  deleted: z.array(z.uuid()).max(30),
});

/** Enregistre toute la liste en un seul lot (fonction SQL freelance_save_services : tout ou rien). */
export async function saveServices(items: ServiceDraft[], deleted: string[]): Promise<SaveListResult<ServiceDraft>> {
  const { supabase } = await requireAdmin();
  const parsed = payload.safeParse({ items: items.map(serviceToInput), deleted });
  if (!parsed.success) return { ok: false, error: 'Un service contient une erreur. Ouvrez-le pour la corriger.' };

  const slugs = parsed.data.items.map((i) => i.slug);
  if (new Set(slugs).size !== slugs.length) return { ok: false, error: 'Deux services ont la même adresse.' };

  // La liste doit être complète : les positions sont recalculées pour tous les éléments.
  const incomplete = await checkCompleteList(
    supabase,
    'freelance_services',
    parsed.data.items.map((i) => i.id),
    parsed.data.deleted,
  );
  if (incomplete) return { ok: false, error: incomplete };

  const { error } = await supabase.rpc('freelance_save_services', {
    items: parsed.data.items,
    deleted: parsed.data.deleted,
  });
  if (error) return { ok: false, error: rpcMessage(error.code) };

  updateTag(CONTENT_TAG); // le site se met à jour maintenant, et seulement maintenant
  revalidatePath('/admin', 'layout'); // compteurs de la barre latérale

  const { data } = await supabase.from('freelance_services').select(SERVICE_COLUMNS).order('position');
  return { ok: true, items: ((data ?? []) as ServiceRow[]).map(serviceFromRow) };
}

function rpcMessage(code?: string) {
  switch (code) {
    case '23505':
      return 'Deux services ont la même adresse. Renommez l’un des deux.';
    case '42883':
    case 'PGRST202':
      return 'La base n’est pas à jour : exécutez supabase/freelance-admin-2.sql dans Supabase.';
    case '42501':
      return 'Accès refusé. Reconnectez-vous.';
    default:
      return 'Enregistrement impossible. Rien n’a été modifié sur le site.';
  }
}
