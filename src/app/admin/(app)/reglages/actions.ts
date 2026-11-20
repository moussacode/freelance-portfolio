'use server';

import { updateTag } from 'next/cache';
import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { CONTENT_TAG } from '@/lib/cache-tags';
import { IMAGE_BUCKET, removeImage, uploadImage } from '@/lib/images';
import { publicEnv } from '@/lib/env';
import { settingsFormSchema } from '@/lib/validation';

export type SaveResult =
  | { ok: true; photoUrl: string | null }
  | { ok: false; error: string; fields?: Record<string, string> };

/** Erreurs zod → { 'whatsapp_messages.quote.fr': 'message' }. */
function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join('.')] ??= issue.message;
  return out;
}

const publicUrl = (path: string) => `${publicEnv().url}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;

/**
 * Enregistre les réglages, uniquement quand l'admin clique sur « Enregistrer ».
 * FormData : `data` (JSON des réglages), `photo` (nouvelle image, facultative), `removePhoto` ('1').
 * Ordre sûr pour la photo : 1. envoi de la nouvelle ; 2. mise à jour de la ligne ;
 * 3. seulement si tout a réussi, suppression de l'ancienne. En cas d'échec, la nouvelle est retirée.
 * Le cache du site n'est vidé qu'après un enregistrement réussi.
 */
export async function saveSettings(form: FormData): Promise<SaveResult> {
  const { supabase } = await requireAdmin();

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get('data') ?? ''));
  } catch {
    return { ok: false, error: 'Données illisibles. Rechargez la page.' };
  }
  const parsed = settingsFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: 'Certains champs sont à corriger.', fields: fieldErrors(parsed.error) };
  }

  const { data: before, error: readError } = await supabase
    .from('freelance_settings')
    .select('photo_path')
    .eq('id', 1)
    .single();
  if (readError || !before) return { ok: false, error: 'Réglages introuvables. Réessayez.' };

  // Photo : nouvelle image, retrait, ou inchangée.
  const photo = form.get('photo');
  const wantsRemove = form.get('removePhoto') === '1';
  let photoPath: string | null = before.photo_path;
  let uploaded: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    const up = await uploadImage(supabase, photo, 'avatar');
    if (!up.ok) return { ok: false, error: up.error, fields: { photo: up.error } };
    uploaded = up.path;
    photoPath = up.path;
  } else if (wantsRemove) {
    photoPath = null;
  }

  const d = parsed.data;
  const { data, error } = await supabase
    .from('freelance_settings')
    .update({
      email: d.email,
      whatsapp_number: d.whatsapp_number,
      whatsapp_messages: d.whatsapp_messages,
      is_available: d.is_available,
      socials: d.socials,
      photo_path: photoPath,
    })
    .eq('id', 1)
    .select('id');
  if (error || !data?.length) {
    await removeImage(supabase, uploaded); // rien ne reste de cet essai
    return { ok: false, error: 'Enregistrement impossible. Rien n’a été modifié sur le site.' };
  }

  // Enregistrement réussi : on peut maintenant supprimer l'ancienne photo.
  if (before.photo_path && before.photo_path !== photoPath) await removeImage(supabase, before.photo_path);

  updateTag(CONTENT_TAG);
  return { ok: true, photoUrl: photoPath ? publicUrl(photoPath) : null };
}
