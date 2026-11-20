import type { L } from './i18n';

/**
 * Contenu fixe du site freelance : identité, raisons, méthode.
 * Le contenu modifiable depuis l'admin (services, réalisations, questions, avis, coordonnées)
 * vient de Supabase, avec src/content/fallback.ts en repli.
 * Règles : aucun nom de client, aucun chiffre inventé, aucun prix affiché sans ton accord.
 */

export const person = {
  name: 'Moussa Ali Mchangama',
  handle: 'MoussaCode',
  social: '@moussa_code',
  /** Adresse du site freelance (sert au référencement). */
  site: 'https://moussacode.dev',
  /** Portfolio détaillé, pour le lien « Voir tous mes projets ». */
  portfolio: 'https://moussacode.dev',
};

/* ---------- Ce qui change avec moi ---------- */
export const reasons: { title: L; text: L }[] = [
  {
    title: { fr: 'Un seul interlocuteur', en: 'One point of contact' },
    text: {
      fr: 'Je fais le design et le développement. Rien ne se perd entre deux prestataires.',
      en: 'I do both the design and the development. Nothing gets lost between two providers.',
    },
  },
  {
    title: { fr: 'Une maquette avant le code', en: 'A mockup before the code' },
    text: {
      fr: 'Vous voyez votre site et vous le validez avant que le développement commence.',
      en: 'You see your site and approve it before development starts.',
    },
  },
  {
    title: { fr: 'Un site que vous maîtrisez', en: 'A site you control' },
    text: {
      fr: 'À la livraison, je vous montre comment modifier vos contenus vous-même.',
      en: 'At delivery, I show you how to update your content yourself.',
    },
  },
];

/* ---------- Méthode (une vraie suite d'étapes) ---------- */
export const steps: { title: L; text: L }[] = [
  {
    title: { fr: 'On en parle', en: 'We talk' },
    text: {
      fr: 'Vous m’expliquez votre activité et votre besoin, par message ou en appel.',
      en: 'You tell me about your business and what you need, by message or on a call.',
    },
  },
  {
    title: { fr: 'Devis et maquette', en: 'Quote and mockup' },
    text: {
      fr: 'Vous recevez un devis clair, puis une maquette à valider.',
      en: 'You receive a clear quote, then a mockup to approve.',
    },
  },
  {
    title: { fr: 'Développement', en: 'Development' },
    text: {
      fr: 'Je construis le site et je vous montre l’avancement à chaque étape.',
      en: 'I build the site and show you the progress at each stage.',
    },
  },
  {
    title: { fr: 'Mise en ligne', en: 'Launch' },
    text: {
      fr: 'Je mets le site en ligne et je vous forme à sa mise à jour.',
      en: 'I put the site online and train you to update it.',
    },
  },
];
