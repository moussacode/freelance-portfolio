import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import type { L } from '@/content/i18n';
import type { SiteContent, Settings } from '@/content/model';
import { fallbackContent } from '@/content/fallback';
import { publicEnv, supabaseConfigured } from '@/lib/env';
import { coverIds } from '@/lib/validation';
import { PUBLIC_TIMEOUT_MS, publicClient } from '@/lib/supabase/public';

/**
 * Contenu du site public.
 * - Supabase répond : son contenu (déjà filtré par RLS sur `visible`).
 * - Supabase absent, en erreur ou trop lent :
 *   au build et en développement → contenu de repli (src/content/fallback.ts) ;
 *   en production (revalidation ISR) → l'erreur remonte, et Next continue de servir
 *   la dernière version en cache au lieu de la remplacer par le repli.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!supabaseConfigured) return fallbackContent;
  try {
    return await withTimeout(load(), PUBLIC_TIMEOUT_MS);
  } catch (error) {
    const building = process.env.NEXT_PHASE === 'phase-production-build';
    if (building || process.env.NODE_ENV !== 'production') {
      console.warn(`[contenu] Supabase indisponible, contenu de repli utilisé : ${String(error)}`);
      return fallbackContent;
    }
    throw error;
  }
});

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`délai de ${ms} ms dépassé`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/* ---------- Lecture ---------- */

const text = z.string();
const maybe = z.string().nullable();
/** Texte traduit : l'anglais manquant est remplacé par le français. */
const l = (fr: string, en: string | null): L => ({ fr, en: en ?? fr });

const serviceRow = z.object({
  slug: text,
  name_fr: text,
  name_en: maybe,
  pitch_fr: text,
  pitch_en: maybe,
  points_fr: z.array(text),
  points_en: z.array(text).nullable(),
});
const workRow = z.object({
  slug: text,
  name_fr: text,
  name_en: maybe,
  kind_fr: text,
  kind_en: maybe,
  frame_fr: text,
  frame_en: maybe,
  text_fr: text,
  text_en: maybe,
  cover_id: z.enum(coverIds).nullable(),
  image_path: maybe,
  url: maybe,
});
const faqRow = z.object({ slug: text, question_fr: text, question_en: maybe, answer_fr: text, answer_en: maybe });
const testimonialRow = z.object({ id: text, quote_fr: text, quote_en: maybe, author: text });
const messages = z.object({ fr: text, en: text });
const settingsRow = z.object({
  email: maybe,
  whatsapp_number: maybe,
  whatsapp_messages: z
    .object({ contact: messages, quote: messages, brief: messages })
    .partial()
    .catch({}),
  is_available: z.boolean(),
  socials: z
    .object({ linkedin: text, github: text, instagram: text, tiktok: text })
    .partial()
    .catch({}),
  photo_path: maybe,
});

const BUCKET = 'freelance-images';
const imageUrl = (path: string) => `${publicEnv().url}/storage/v1/object/public/${BUCKET}/${path}`;

async function load(): Promise<SiteContent> {
  const db = publicClient();
  const list = (table: string, columns: string) =>
    db.from(table).select(columns).eq('visible', true).order('position').order('created_at');

  const [services, works, faq, testimonials, settings] = await Promise.all([
    list('freelance_services', 'slug,name_fr,name_en,pitch_fr,pitch_en,points_fr,points_en'),
    list(
      'freelance_works',
      'slug,name_fr,name_en,kind_fr,kind_en,frame_fr,frame_en,text_fr,text_en,cover_id,image_path,url',
    ),
    list('freelance_faq', 'slug,question_fr,question_en,answer_fr,answer_en'),
    list('freelance_testimonials', 'id,quote_fr,quote_en,author'),
    db
      .from('freelance_settings')
      .select('email,whatsapp_number,whatsapp_messages,is_available,socials,photo_path')
      .eq('id', 1)
      .single(),
  ]);
  for (const r of [services, works, faq, testimonials, settings]) {
    if (r.error) throw new Error(`${r.error.code ?? ''} ${r.error.message}`);
  }

  return {
    services: z.array(serviceRow).parse(services.data).map((s) => ({
      id: s.slug,
      name: l(s.name_fr, s.name_en),
      pitch: l(s.pitch_fr, s.pitch_en),
      points: s.points_fr.map((p, i) => l(p, s.points_en?.[i] ?? null)),
    })),
    works: z.array(workRow).parse(works.data).map((w) => ({
      id: w.slug,
      name: l(w.name_fr, w.name_en),
      kind: l(w.kind_fr, w.kind_en),
      frame: l(w.frame_fr, w.frame_en),
      text: l(w.text_fr, w.text_en),
      cover: w.image_path ? null : w.cover_id,
      image: w.image_path ? imageUrl(w.image_path) : null,
      url: w.url,
    })),
    faq: z.array(faqRow).parse(faq.data).map((f) => ({
      id: f.slug,
      q: l(f.question_fr, f.question_en),
      a: l(f.answer_fr, f.answer_en),
    })),
    testimonials: z.array(testimonialRow).parse(testimonials.data).map((t) => ({
      id: t.id,
      quote: l(t.quote_fr, t.quote_en),
      author: t.author,
    })),
    settings: toSettings(settingsRow.parse(settings.data)),
  };
}

function toSettings(row: z.infer<typeof settingsRow>): Settings {
  const fb = fallbackContent.settings.messages;
  const m = row.whatsapp_messages;
  return {
    email: row.email,
    whatsapp: row.whatsapp_number,
    // Un message pas encore réglé reprend le texte par défaut.
    messages: { contact: m.contact ?? fb.contact, quote: m.quote ?? fb.quote, brief: m.brief ?? fb.brief },
    available: row.is_available,
    // Seuls les liens https:// sont gardés (jamais javascript: ni data:), même si la base a été modifiée ailleurs.
    socials: Object.fromEntries(Object.entries(row.socials).filter(([, v]) => typeof v === 'string' && /^https:\/\/[^\s<>"]+$/.test(v))),
    avatar: row.photo_path ? imageUrl(row.photo_path) : fallbackContent.settings.avatar,
  };
}
