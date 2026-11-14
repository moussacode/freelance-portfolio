export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const htmlLang: Record<Locale, string> = { fr: 'fr', en: 'en' };
export const localeNames: Record<Locale, string> = { fr: 'Français', en: 'English' };

/** Texte traduit. */
export type L = { fr: string; en: string };

export const tr = (text: L, locale: Locale): string => text[locale] ?? text.fr;
export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);
