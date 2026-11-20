import type { DraftItem } from '@/components/admin/useCollectionDraft';

/** Service tel qu'édité dans l'admin. Textes anglais vides = à traduire (le site affiche le français). */
export type ServiceDraft = DraftItem & {
  slug: string;
  name_fr: string;
  name_en: string;
  pitch_fr: string;
  pitch_en: string;
  points_fr: [string, string, string];
  points_en: [string, string, string];
};

export type ServiceRow = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string | null;
  pitch_fr: string;
  pitch_en: string | null;
  points_fr: string[];
  points_en: string[] | null;
  visible: boolean;
};

export const SERVICE_COLUMNS = 'id,slug,name_fr,name_en,pitch_fr,pitch_en,points_fr,points_en,visible';

const three = (list: string[] | null | undefined): [string, string, string] => [list?.[0] ?? '', list?.[1] ?? '', list?.[2] ?? ''];

export const serviceFromRow = (r: ServiceRow): ServiceDraft => ({
  key: r.slug,
  id: r.id,
  slug: r.slug,
  name_fr: r.name_fr,
  name_en: r.name_en ?? '',
  pitch_fr: r.pitch_fr,
  pitch_en: r.pitch_en ?? '',
  points_fr: three(r.points_fr),
  points_en: three(r.points_en),
  visible: r.visible,
});

/** Brouillon → données validées par serviceSchema (anglais vide → null). */
export const serviceToInput = (s: ServiceDraft) => ({
  id: s.id,
  slug: s.slug,
  name_fr: s.name_fr,
  name_en: s.name_en,
  pitch_fr: s.pitch_fr,
  pitch_en: s.pitch_en,
  points_fr: s.points_fr,
  points_en: s.points_en.every((p) => !p.trim()) ? null : s.points_en,
  visible: s.visible,
});
