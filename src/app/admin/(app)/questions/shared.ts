import type { DraftItem } from '@/components/admin/useCollectionDraft';

/** Question telle qu'éditée dans l'admin. Anglais vide = à traduire (le site affiche le français). */
export type FaqDraft = DraftItem & {
  slug: string;
  question_fr: string;
  question_en: string;
  answer_fr: string;
  answer_en: string;
};

export type FaqRow = {
  id: string;
  slug: string;
  question_fr: string;
  question_en: string | null;
  answer_fr: string;
  answer_en: string | null;
  visible: boolean;
};

export const FAQ_COLUMNS = 'id,slug,question_fr,question_en,answer_fr,answer_en,visible';

export const faqFromRow = (r: FaqRow): FaqDraft => ({
  key: r.slug,
  id: r.id,
  slug: r.slug,
  question_fr: r.question_fr,
  question_en: r.question_en ?? '',
  answer_fr: r.answer_fr,
  answer_en: r.answer_en ?? '',
  visible: r.visible,
});

export const faqToInput = (f: FaqDraft) => ({
  id: f.id,
  slug: f.slug,
  question_fr: f.question_fr,
  question_en: f.question_en,
  answer_fr: f.answer_fr,
  answer_en: f.answer_en,
  visible: f.visible,
});
