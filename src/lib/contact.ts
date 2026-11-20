import { tr, type Locale } from '@/content/i18n';
import type { Settings, WaContext } from '@/content/model';

/**
 * Seule fonction qui fabrique un lien WhatsApp sur le site.
 * Le numéro et les messages viennent des réglages (admin). null si WhatsApp est désactivé.
 * - contact : « Discuter sur WhatsApp » (accueil, barre du bas)
 * - quote   : « Demander un devis » d'un service ; {service} est remplacé par son nom
 * - brief   : mini-brief de la section Contact ; `body` est ajouté sous l'en-tête
 */
export function buildWhatsAppLink(
  settings: Settings,
  { context, lang, service, body }: { context: WaContext; lang: Locale; service?: string; body?: string },
): string | null {
  if (!settings.whatsapp) return null;
  let text = tr(settings.messages[context], lang);
  if (context === 'quote') text = text.replaceAll('{service}', service ?? '');
  if (body) text = [text, body].filter(Boolean).join('\n');
  return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Lien e-mail pré-rempli. null si aucune adresse n'est réglée. */
export function buildMailLink(settings: Settings, subject?: string, body?: string): string | null {
  if (!settings.email) return null;
  if (subject === undefined) return `mailto:${settings.email}`;
  return `mailto:${settings.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body ?? '')}`;
}
