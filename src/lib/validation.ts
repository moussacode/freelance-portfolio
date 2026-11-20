import { z } from 'zod';

/**
 * Schémas zod partagés, alignés sur les contraintes de supabase/freelance-admin.sql.
 * Le serveur revalide toujours avec ces schémas : la validation côté client n'est qu'un confort.
 */

export const coverIds = ['jappo', 'eco', 'teranga', 'smart', 'shop'] as const;

/** Texte obligatoire, espaces retirés. */
const req = (max: number) => z.string().trim().min(1).max(max);
/** Texte facultatif : une chaîne vide devient null (= à traduire). */
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const slugSchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets.');

export const httpsUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === 'https:' && Boolean(u.hostname);
    } catch {
      return false;
    }
  }, 'Adresse https:// valide attendue.');

/**
 * Nom d'un fichier du bucket freelance-images, tel que la contrainte SQL l'accepte :
 * nom simple, sans dossier, extension png, jpg ou webp (jamais .jpeg ni .svg).
 */
export const imagePathSchema = z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/, 'Nom de fichier invalide.');

/** Un point « Ce que vous recevez » : 1 à 120 caractères. */
const point = z.string().trim().min(1).max(120);

export const serviceSchema = z.object({
  slug: slugSchema,
  name_fr: req(60),
  name_en: opt(60),
  pitch_fr: req(200),
  pitch_en: opt(200),
  points_fr: z.tuple([point, point, point]),
  points_en: z.tuple([point, point, point]).nullish().transform((v) => v ?? null),
  visible: z.boolean(),
});

export const workSchema = z
  .object({
    slug: slugSchema,
    name_fr: req(80),
    name_en: opt(80),
    kind_fr: req(40),
    kind_en: opt(40),
    frame_fr: req(80),
    frame_en: opt(80),
    text_fr: req(300),
    text_en: opt(300),
    cover_id: z.enum(coverIds).nullish().transform((v) => v ?? null),
    image_path: imagePathSchema.nullish().transform((v) => v ?? null),
    url: httpsUrl.nullish().or(z.literal('').transform(() => null)).transform((v) => v || null),
    visible: z.boolean(),
  })
  .refine((w) => w.cover_id !== null || w.image_path !== null, {
    message: 'Choisissez une affiche ou importez une image.',
    path: ['cover_id'],
  });

export const faqSchema = z.object({
  slug: slugSchema,
  question_fr: req(160),
  question_en: opt(160),
  answer_fr: req(800),
  answer_en: opt(800),
  visible: z.boolean(),
});

export const testimonialSchema = z
  .object({
    quote_fr: req(500),
    quote_en: opt(500),
    author: req(80),
    consent: z.boolean(),
    visible: z.boolean(),
  })
  .refine((t) => !t.visible || t.consent, {
    message: 'Impossible de publier un avis sans l’accord écrit de la personne.',
    path: ['visible'],
  });

const message = z.object({ fr: req(500), en: req(500) });

export const settingsSchema = z.object({
  email: z.email().max(120).nullish().transform((v) => v ?? null),
  whatsapp_number: z
    .string()
    .regex(/^[0-9]{8,15}$/, 'Chiffres seuls, avec l’indicatif (8 à 15 chiffres).')
    .nullish()
    .or(z.literal('').transform(() => null))
    .transform((v) => v || null),
  whatsapp_messages: z.object({
    contact: message,
    quote: message.refine((m) => m.fr.includes('{service}') && m.en.includes('{service}'), {
      message: 'Le message de devis doit contenir {service}.',
    }),
    brief: message,
  }),
  is_available: z.boolean(),
  socials: z.object({
    linkedin: httpsUrl.optional(),
    github: httpsUrl.optional(),
    instagram: httpsUrl.optional(),
    tiktok: httpsUrl.optional(),
  }),
  photo_path: imagePathSchema.nullish().transform((v) => v ?? null),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
export type WorkInput = z.infer<typeof workSchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
