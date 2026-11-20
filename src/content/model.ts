import type { L } from './i18n';
import type { CoverId } from '@/components/Cover';

/**
 * Forme du contenu modifiable depuis l'admin, telle que les composants la reçoivent.
 * Source : Supabase (tables freelance_*), ou src/content/fallback.ts si Supabase ne répond pas.
 * Une traduction anglaise manquante est déjà remplacée par le français.
 */

export type Service = { id: string; name: L; pitch: L; points: L[] };

export type Work = {
  id: string;
  name: L;
  kind: L;
  frame: L;
  text: L;
  /** Affiche dessinée (composant Cover), ou null si une image est importée. */
  cover: CoverId | null;
  /** Adresse publique de l'image importée. */
  image: string | null;
  url: string | null;
};

export type FaqItem = { id: string; q: L; a: L };

export type Testimonial = { id: string; quote: L; author: string };

/** Les trois messages WhatsApp pré-écrits. Dans « quote », {service} est remplacé par le nom du service. */
export type WaContext = 'contact' | 'quote' | 'brief';

export type Socials = { linkedin?: string; github?: string; instagram?: string; tiktok?: string };

export type Settings = {
  email: string | null;
  /** Chiffres seuls avec l'indicatif. null = WhatsApp masqué partout. */
  whatsapp: string | null;
  messages: Record<WaContext, L>;
  available: boolean;
  socials: Socials;
  /** Photo ronde de la barre et du pied de page. */
  avatar: string;
};

export type SiteContent = {
  services: Service[];
  works: Work[];
  faq: FaqItem[];
  testimonials: Testimonial[];
  settings: Settings;
};
