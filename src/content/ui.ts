import type { Locale } from './i18n';

/** Textes de l'interface. Dans un titre, les crochets marquent le passage en teal : « Parlons de [votre projet] ». */
const fr = {
  meta: {
    title: 'MoussaCode — Designer UI/UX & Développeur',
    description: 'Designer UI/UX et développeur web & mobile. Des sites et des apps qu’on a envie d’utiliser.',
  },
  a11y: {
    skip: 'Aller au contenu',
    home: 'MoussaCode, retour en haut de page',
    mainNav: 'Navigation principale',
    menu: 'Menu',
    close: 'Fermer',
    language: 'Langue',
    toDark: 'Passer en mode sombre',
    toLight: 'Passer en mode clair',
    newTab: 'nouvel onglet',
    available: 'Disponible pour de nouvelles missions',
  },
  nav: { services: 'Services', works: 'Réalisations', method: 'Méthode', faq: 'Questions', quote: 'Demander un devis' },
  hero: {
    tag: 'Développeur web freelance à Dakar',
    // Le titre a un début fixe et plusieurs fins (en teal) qui se relaient.
    // La première fin est celle qui s'affiche sans JavaScript.
    titleLead: 'Un site qui vous',
    titleEnds: ['ramène des clients.', 'fait vendre en ligne.', 'fait gagner du temps.', 'ressemble.'],
    lead: 'Je conçois et développe votre site vitrine, votre boutique en ligne ou votre application, de la maquette à la mise en ligne.',
    primary: 'Discuter sur WhatsApp',
    primaryNoWa: 'Demander un devis',
    secondary: 'Voir les réalisations',
    cardLabel: 'Ce que je fais',
    photoAlt: 'Moussa Ali Mchangama, développeur web freelance',
  },
  services: {
    title: 'Ce que je peux [faire pour vous]',
    intro: 'Six services, seuls ou combinés. Chaque projet commence par un échange pour comprendre votre besoin.',
    includes: 'Ce que vous recevez',
    ask: 'Demander un devis',
  },
  reasons: { title: 'Travailler avec moi, [concrètement]' },
  works: {
    title: 'Quelques [réalisations]',
    intro: 'Une mission client et des projets que j’ai conçus et développés.',
    all: 'Voir tous mes projets en détail',
    visit: 'Voir le projet',
  },
  method: {
    title: 'Comment [ça se passe]',
    intro: 'Quatre étapes, et vous savez toujours où en est votre projet.',
    step: 'Étape',
  },
  testimonials: { title: 'Ce qu’en disent [mes clients]' },
  faq: { title: 'Vos [questions]' },
  contact: {
    title: 'Parlons de [votre projet].',
    lead: 'Décrivez votre besoin en quelques mots. Vous recevez une réponse, puis un devis.',
    name: 'Votre nom',
    type: 'Votre besoin',
    other: 'Autre chose',
    message: 'Votre projet en quelques mots',
    messageHint: 'Votre activité, ce que vous voulez, et votre échéance si vous en avez une.',
    sendWa: 'Envoyer sur WhatsApp',
    sendMail: 'Envoyer par e-mail',
    // Les messages WhatsApp pré-écrits (accueil, devis, en-tête du brief) se règlent dans l'admin.
    note: 'Le message s’ouvre dans WhatsApp ou dans votre messagerie. Rien n’est enregistré sur ce site.',
    subject: 'Demande de devis',
    iAm: 'Je suis',
    need: 'Mon besoin :',
    direct: 'Ou écrivez-moi directement',
    copy: 'Copier l’adresse e-mail',
    copied: 'Adresse copiée',
  },
  sticky: 'Discuter sur WhatsApp',
  footer: {
    motion: 'Animations',
    motionOn: 'activées',
    motionOff: 'réduites',
    top: 'Haut de page',
    rights: 'MoussaCode. Moussa Ali Mchangama, développeur web freelance, Dakar.',
  },
};

export type Dict = typeof fr;

const en: Dict = {
  meta: {
    title: 'MoussaCode — UI/UX Designer & Developer',
    description: 'UI/UX designer and web & mobile developer. Websites and apps people want to use.',
  },
  a11y: {
    skip: 'Skip to content',
    home: 'MoussaCode, back to top',
    mainNav: 'Main navigation',
    menu: 'Menu',
    close: 'Close',
    language: 'Language',
    toDark: 'Switch to dark mode',
    toLight: 'Switch to light mode',
    newTab: 'new tab',
    available: 'Available for new work',
  },
  nav: { services: 'Services', works: 'Work', method: 'Process', faq: 'Questions', quote: 'Request a quote' },
  hero: {
    tag: 'Freelance web developer in Dakar',
    titleLead: 'A website that',
    titleEnds: ['brings you clients.', 'sells for you online.', 'saves you time.', 'looks like you.'],
    lead: 'I design and build your business website, online shop or application, from the mockup to launch.',
    primary: 'Chat on WhatsApp',
    primaryNoWa: 'Request a quote',
    secondary: 'See the work',
    cardLabel: 'What I do',
    photoAlt: 'Moussa Ali Mchangama, freelance web developer',
  },
  services: {
    title: 'What I can [do for you]',
    intro: 'Six services, alone or combined. Every project starts with a conversation to understand your need.',
    includes: 'What you get',
    ask: 'Request a quote',
  },
  reasons: { title: 'Working with me, [in practice]' },
  works: {
    title: 'Selected [work]',
    intro: 'One client job and projects I designed and built.',
    all: 'See all my projects in detail',
    visit: 'See the project',
  },
  method: {
    title: 'How [it works]',
    intro: 'Four steps, and you always know where your project stands.',
    step: 'Step',
  },
  testimonials: { title: 'What [my clients] say' },
  faq: { title: 'Your [questions]' },
  contact: {
    title: 'Let’s talk about [your project].',
    lead: 'Describe what you need in a few words. You get a reply, then a quote.',
    name: 'Your name',
    type: 'What you need',
    other: 'Something else',
    message: 'Your project in a few words',
    messageHint: 'Your business, what you want, and your deadline if you have one.',
    sendWa: 'Send on WhatsApp',
    sendMail: 'Send by e-mail',
    note: 'The message opens in WhatsApp or in your mail app. Nothing is stored on this site.',
    subject: 'Quote request',
    iAm: 'I am',
    need: 'My need:',
    direct: 'Or write to me directly',
    copy: 'Copy the e-mail address',
    copied: 'Address copied',
  },
  sticky: 'Chat on WhatsApp',
  footer: {
    motion: 'Animations',
    motionOn: 'on',
    motionOff: 'reduced',
    top: 'Back to top',
    rights: 'MoussaCode. Moussa Ali Mchangama, freelance web developer, Dakar.',
  },
};

const dicts: Record<Locale, Dict> = { fr, en };
export const getDict = (locale: Locale): Dict => dicts[locale];
