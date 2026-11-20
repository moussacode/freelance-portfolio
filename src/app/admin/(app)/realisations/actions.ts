'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { CONTENT_TAG } from '@/lib/cache-tags';
import { removeImage, uploadImage } from '@/lib/images';
import { checkCompleteList } from '@/lib/list-guard';
import { hasCover, workBaseSchema } from '@/lib/validation';
import type { SaveListResult } from '@/components/admin/CollectionEditor';
import { MAX_NEW_IMAGES, WORK_COLUMNS, workFromRow, type WorkDraft, type WorkRow } from './shared';

const item = workBaseSchema.extend({ id: z.uuid().nullable(), key: z.string().max(80), newImage: z.boolean() });
const payload = z.object({ items: z.array(item).max(30), deleted: z.array(z.uuid()).max(30) });

/**
 * Enregistre toutes les réalisations en un seul lot.
 * FormData : `data` (JSON { items, deleted }) et `image:<clé>` pour chaque nouvelle image.
 * Ordre sûr : 1. envoi des nouvelles images ; 2. lot SQL (tout ou rien) ;
 * 3. seulement s'il a réussi, suppression des anciennes images qui ne servent plus.
 * En cas d'échec, les images tout juste envoyées sont retirées : rien ne change.
 */
export async function saveWorks(form: FormData): Promise<SaveListResult<WorkDraft>> {
  const { supabase } = await requireAdmin();

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get('data') ?? ''));
  } catch {
    return { ok: false, error: 'Données illisibles. Rechargez la page.' };
  }
  const parsed = payload.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'Une réalisation contient une erreur. Ouvrez-la pour la corriger.' };
  const { items, deleted } = parsed.data;

  const slugs = items.map((i) => i.slug);
  if (new Set(slugs).size !== slugs.length) return { ok: false, error: 'Deux réalisations ont la même adresse.' };
  if (items.filter((i) => i.newImage).length > MAX_NEW_IMAGES) {
    return { ok: false, error: `${MAX_NEW_IMAGES} nouvelles images au plus par enregistrement.` };
  }

  const incomplete = await checkCompleteList(supabase, 'freelance_works', items.map((i) => i.id), deleted);
  if (incomplete) return { ok: false, error: incomplete };

  // Images actuellement utilisées, pour savoir lesquelles supprimer après coup.
  const { data: before } = await supabase.from('freelance_works').select('image_path');
  const oldPaths = new Set((before ?? []).map((r) => r.image_path).filter((p): p is string => Boolean(p)));

  // 1. Envoi des nouvelles images (type réel vérifié, nom aléatoire, SVG refusé).
  const uploaded: string[] = [];
  const rollback = async () => {
    for (const path of uploaded) await removeImage(supabase, path);
  };
  const finalItems = [];
  for (const it of items) {
    let image_path = it.image_path;
    if (it.newImage) {
      const up = await uploadImage(supabase, form.get(`image:${it.key}`), 'work');
      if (!up.ok) {
        await rollback();
        return { ok: false, error: `« ${it.name_fr} » : ${up.error}` };
      }
      uploaded.push(up.path);
      image_path = up.path;
    }
    const final = { ...it, image_path, cover_id: image_path ? null : it.cover_id };
    if (!hasCover(final)) {
      await rollback();
      return { ok: false, error: `« ${it.name_fr} » : choisissez une affiche ou une image.` };
    }
    const { key: _key, newImage: _newImage, ...row } = final;
    finalItems.push(row);
  }

  // 2. Lot SQL : tout ou rien.
  const { error } = await supabase.rpc('freelance_save_works', { items: finalItems, deleted });
  if (error) {
    await rollback();
    const missing = error.code === '42883' || error.code === 'PGRST202';
    return {
      ok: false,
      error: missing
        ? 'La base n’est pas à jour : exécutez supabase/freelance-admin-3.sql dans Supabase.'
        : 'Enregistrement impossible. Rien n’a été modifié sur le site.',
    };
  }

  // 3. Réussi : les anciennes images qui ne servent plus sont supprimées.
  const used = new Set(finalItems.map((i) => i.image_path).filter(Boolean));
  for (const path of oldPaths) if (!used.has(path)) await removeImage(supabase, path);

  updateTag(CONTENT_TAG);
  revalidatePath('/admin', 'layout');

  const { data } = await supabase.from('freelance_works').select(WORK_COLUMNS).order('position');
  return { ok: true, items: ((data ?? []) as WorkRow[]).map(workFromRow) };
}
