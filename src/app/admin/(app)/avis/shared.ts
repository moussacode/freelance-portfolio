import type { DraftItem } from '@/components/admin/useCollectionDraft';

/**
 * Avis client tel qu'édité dans l'admin.
 * consent : « J'ai l'accord écrit de cette personne ». Sans accord, l'avis ne peut pas être visible
 * (vérifié dans l'admin, par le serveur et par une contrainte de la base).
 */
export type TestimonialDraft = DraftItem & {
  quote_fr: string;
  quote_en: string;
  author: string;
  consent: boolean;
  /** Date de l'accord enregistrée en base (lecture seule). */
  consent_at: string | null;
};

export type TestimonialRow = {
  id: string;
  quote_fr: string;
  quote_en: string | null;
  author: string;
  consent_at: string | null;
  visible: boolean;
};

export const TESTIMONIAL_COLUMNS = 'id,quote_fr,quote_en,author,consent_at,visible';

export const testimonialFromRow = (r: TestimonialRow): TestimonialDraft => ({
  key: r.id,
  id: r.id,
  quote_fr: r.quote_fr,
  quote_en: r.quote_en ?? '',
  author: r.author,
  consent: r.consent_at !== null,
  consent_at: r.consent_at,
  visible: r.visible,
});

export const testimonialToInput = (t: TestimonialDraft) => ({
  id: t.id,
  quote_fr: t.quote_fr,
  quote_en: t.quote_en,
  author: t.author,
  consent: t.consent,
  visible: t.visible,
});

export const NO_CONSENT = 'Cochez d’abord « J’ai l’accord écrit de cette personne » : sans accord, l’avis reste masqué.';
