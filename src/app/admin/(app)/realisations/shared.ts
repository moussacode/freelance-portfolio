import type { CoverId } from '@/components/Cover';
import type { DraftItem } from '@/components/admin/useCollectionDraft';

/**
 * Réalisation telle qu'éditée dans l'admin.
 * Couverture : une affiche dessinée (cover_id) OU une image (image_path déjà enregistrée,
 * ou newImage : fichier choisi, envoyé seulement à l'enregistrement).
 */
export type WorkDraft = DraftItem & {
  slug: string;
  name_fr: string;
  name_en: string;
  kind_fr: string;
  kind_en: string;
  frame_fr: string;
  frame_en: string;
  text_fr: string;
  text_en: string;
  cover_id: CoverId | null;
  image_path: string | null;
  url: string;
  /** Image choisie, pas encore envoyée (aperçu local dans `preview`). */
  newImage?: File | null;
  preview?: string | null;
};

export type WorkRow = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  kind_fr: string;
  kind_en: string | null;
  frame_fr: string;
  frame_en: string | null;
  text_fr: string;
  text_en: string | null;
  cover_id: CoverId | null;
  image_path: string | null;
  url: string | null;
  visible: boolean;
};

export const WORK_COLUMNS =
  'id,slug,name_fr,name_en,kind_fr,kind_en,frame_fr,frame_en,text_fr,text_en,cover_id,image_path,url,visible';

export const workFromRow = (r: WorkRow): WorkDraft => ({
  key: r.slug,
  id: r.id,
  slug: r.slug,
  name_fr: r.name_fr,
  name_en: r.name_en ?? '',
  kind_fr: r.kind_fr,
  kind_en: r.kind_en ?? '',
  frame_fr: r.frame_fr,
  frame_en: r.frame_en ?? '',
  text_fr: r.text_fr,
  text_en: r.text_en ?? '',
  cover_id: r.cover_id,
  image_path: r.image_path,
  url: r.url ?? '',
  visible: r.visible,
});

/** Brouillon → données envoyées au serveur (sans le fichier ni l'aperçu). */
export const workToInput = (w: WorkDraft) => ({
  id: w.id,
  key: w.key,
  slug: w.slug,
  name_fr: w.name_fr,
  name_en: w.name_en,
  kind_fr: w.kind_fr,
  kind_en: w.kind_en,
  frame_fr: w.frame_fr,
  frame_en: w.frame_en,
  text_fr: w.text_fr,
  text_en: w.text_en,
  cover_id: w.cover_id,
  image_path: w.newImage ? null : w.image_path,
  url: w.url,
  visible: w.visible,
  newImage: Boolean(w.newImage),
});

/** Nombre maximal de nouvelles images envoyées en un seul enregistrement. */
export const MAX_NEW_IMAGES = 6;
