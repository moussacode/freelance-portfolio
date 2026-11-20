import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Bucket des images du site freelance (voir supabase/freelance-admin.sql). */
export const IMAGE_BUCKET = 'freelance-images';
/** Taille maximale d'une image, alignée sur la limite du bucket. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type ImageKind = { ext: 'png' | 'jpg' | 'webp'; mime: 'image/png' | 'image/jpeg' | 'image/webp' };

/**
 * Type réel d'une image, lu dans ses premiers octets (jamais dans l'extension ni le type annoncé).
 * Seuls PNG, JPEG et WebP sont reconnus : un SVG (texte), un PDF ou un exécutable renvoient null.
 */
export function detectImage(bytes: Uint8Array): ImageKind | null {
  const at = (i: number, ...sig: number[]) => sig.every((b, k) => bytes[i + k] === b);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { ext: 'png', mime: 'image/png' };
  if (at(0, 0xff, 0xd8, 0xff)) return { ext: 'jpg', mime: 'image/jpeg' };
  // RIFF....WEBP
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { ext: 'webp', mime: 'image/webp' };
  return null;
}

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

/**
 * Vérifie puis envoie une image dans le bucket, sous un nom aléatoire
 * au format exact attendu par les contraintes SQL : [a-z0-9-]+.(png|jpg|webp), sans dossier.
 * L'envoi passe par la session de l'admin : la policy de stockage revérifie is_admin().
 */
export async function uploadImage(supabase: SupabaseClient, file: unknown, prefix: string): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Aucune image reçue.' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: 'Image trop lourde : 2 Mo maximum.' };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  if (!kind) return { ok: false, error: 'Format refusé : PNG, JPEG ou WebP uniquement (pas de SVG).' };

  const path = `${prefix}-${randomUUID()}.${kind.ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, bytes, {
    contentType: kind.mime,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) return { ok: false, error: 'Envoi de l’image impossible. Réessayez.' };
  return { ok: true, path };
}

/** Supprime une image du bucket (sans échouer si elle n'existe plus). */
export async function removeImage(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}
