'use server';

import { updateTag } from 'next/cache';
import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { CONTENT_TAG } from '@/lib/cache-tags';
import { removeImage, uploadImage, IMAGE_BUCKET } from '@/lib/images';
import { settingsFormSchema } from '@/lib/validation';
import { publicEnv } from '@/lib/env';

export type SaveResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: string; fields?: Record<string, string> };

/** Erreurs zod → { 'whatsapp_messages.quote.fr': 'message' }. */
function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Enregistrement automatique des réglages (contact, messages, disponibilité, réseaux).
 * Revérifie l'accès et valide tout avec zod, puis invalide le cache du site.
 */
export async function saveSettings(input: unknown): Promise<SaveResult> {
  const { supabase } = await requireAdmin();
  const parsed = settingsFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Certains champs sont à corriger.', fields: fieldErrors(parsed.error) };
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
    })
    .eq('id', 1)
    .select('updated_at');
  if (error || !data?.length) return { ok: false, error: 'Enregistrement impossible. Réessayez.' };

  updateTag(CONTENT_TAG);
  return { ok: true, savedAt: data[0].updated_at };
}

export type PhotoResult = { ok: true; url: string | null } | { ok: false; error: string };

const publicUrl = (path: string) => `${publicEnv().url}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;

/** Nouvelle photo (barre et pied de page du site). L'ancienne est supprimée du stockage. */
export async function uploadPhoto(formData: FormData): Promise<PhotoResult> {
  const { supabase } = await requireAdmin();
  const upload = await uploadImage(supabase, formData.get('photo'), 'avatar');
  if (!upload.ok) return upload;

  const { data: before } = await supabase.from('freelance_settings').select('photo_path').eq('id', 1).single();
  const { error } = await supabase.from('freelance_settings').update({ photo_path: upload.path }).eq('id', 1);
  if (error) {
    await removeImage(supabase, upload.path);
    return { ok: false, error: 'Enregistrement de la photo impossible. Réessayez.' };
  }
  await removeImage(supabase, before?.photo_path);
  updateTag(CONTENT_TAG);
  return { ok: true, url: publicUrl(upload.path) };
}

/** Retire la photo importée : le site reprend la photo par défaut. */
export async function removePhoto(): Promise<PhotoResult> {
  const { supabase } = await requireAdmin();
  const { data: before } = await supabase.from('freelance_settings').select('photo_path').eq('id', 1).single();
  const { error } = await supabase.from('freelance_settings').update({ photo_path: null }).eq('id', 1);
  if (error) return { ok: false, error: 'Impossible de retirer la photo. Réessayez.' };
  await removeImage(supabase, before?.photo_path);
  updateTag(CONTENT_TAG);
  return { ok: true, url: null };
}
