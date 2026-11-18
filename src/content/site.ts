import type { L } from './i18n';
import type { CoverId } from '@/components/Cover';

/**
 * Tout le contenu du site freelance est ici : coordonnées, services, réalisations, méthode, questions.
 * Règles : aucun nom de client, aucun chiffre inventé, aucun prix affiché sans ton accord.
 */

export const person = {
  name: 'Moussa Ali Mchangama',
  handle: 'MoussaCode',
  social: '@moussa_code',
  email: 'moussaalimchangama@gmail.com',
  /** Numéro WhatsApp au format international, sans « + » ni espaces. Mets '' pour masquer WhatsApp partout. */
  whatsapp: '221778740422',
  github: 'https://github.com/moussacode',
  linkedin: 'https://www.linkedin.com/in/ali-mchangama-moussa/',
  /** Adresse du site freelance une fois en ligne (sert au référencement). */
  site: 'https://moussacode.dev',
  /** Portfolio détaillé, pour le lien « Voir tous mes projets ». */
  portfolio: 'https://moussacode.dev',
  /** Point vert « disponible » dans la barre. */
  available: true,
};

export const waLink = (message: string) =>
  `https://wa.me/${person.whatsapp}?text=${encodeURIComponent(message)}`;
export const mailLink = (subject: string, body: string) =>
  `mailto:${person.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/* ---------- Services ---------- */
export type Service = { id: string; name: L; pitch: L; points: L[] };

export const services: Service[] = [
  {
    id: 'vitrine',
    name: { fr: 'Site vitrine', en: 'Business website' },
    pitch: {
      fr: 'Un site clair et rapide pour présenter votre activité et recevoir des demandes.',
      en: 'A clear, fast website to present your business and receive enquiries.',
    },
    points: [
      { fr: 'Design sur mesure, pensé d’abord pour le téléphone', en: 'Custom design, built for phones first' },
      { fr: 'Pages structurées pour le référencement Google', en: 'Pages structured for Google search' },
      { fr: 'Formulaire de contact ou bouton WhatsApp', en: 'Contact form or WhatsApp button' },
    ],
  },
  {
    id: 'boutique',
    name: { fr: 'Boutique en ligne', en: 'Online shop' },
    pitch: {
      fr: 'Création ou refonte d’une boutique WordPress / WooCommerce qui donne envie d’acheter.',
      en: 'A new or redesigned WordPress / WooCommerce shop that makes people want to buy.',
    },
    points: [
      { fr: 'Fiches produits et parcours d’achat simples', en: 'Simple product pages and checkout flow' },
      { fr: 'Refonte visuelle de toutes les pages', en: 'Visual redesign of every page' },
      { fr: 'Prise en main pour gérer vos produits vous-même', en: 'Handover so you can manage products yourself' },
    ],
  },
  {
    id: 'application',
    name: { fr: 'Application sur mesure', en: 'Custom application' },
    pitch: {
      fr: 'Un outil web ou mobile fait pour votre façon de travailler : tableau de bord, plateforme, espace client.',
      en: 'A web or mobile tool built around how you work: dashboard, platform, client area.',
    },
    points: [
      { fr: 'Comptes, rôles et accès sécurisés', en: 'Accounts, roles and secure access' },
      { fr: 'Tableaux de bord et statistiques', en: 'Dashboards and statistics' },
      { fr: 'Remplace les fichiers Excel et les messages dispersés', en: 'Replaces Excel files and scattered messages' },
    ],
  },
  {
    id: 'design',
    name: { fr: 'Design UI/UX', en: 'UI/UX design' },
    pitch: {
      fr: 'Des maquettes Figma que vous validez avant d’écrire une seule ligne de code.',
      en: 'Figma mockups you approve before a single line of code is written.',
    },
    points: [
      { fr: 'Maquettes et prototype cliquable', en: 'Mockups and clickable prototype' },
      { fr: 'Charte graphique et design system', en: 'Visual identity and design system' },
      { fr: 'Fichiers prêts pour le développement', en: 'Files ready for development' },
    ],
  },
  {
    id: 'audit',
    name: { fr: 'Audit de site', en: 'Website audit' },
    pitch: {
      fr: 'Un regard extérieur sur ce qui freine vos visiteurs, avec un plan d’action.',
      en: 'An outside look at what holds your visitors back, with an action plan.',
    },
    points: [
      { fr: 'Expérience utilisateur, référencement, conversion', en: 'User experience, search ranking, conversion' },
      { fr: 'Corrections classées par priorité', en: 'Fixes sorted by priority' },
      { fr: 'Aperçu en maquette des changements proposés', en: 'Mockup preview of the proposed changes' },
    ],
  },
  {
    id: 'ia',
    name: { fr: 'Intégration d’IA', en: 'AI integration' },
    pitch: {
      fr: 'L’IA là où elle vous fait gagner du temps, branchée sur vos outils.',
      en: 'AI where it saves you time, connected to your tools.',
    },
    points: [
      { fr: 'Assistant qui répond à partir de vos documents', en: 'Assistant that answers from your documents' },
      { fr: 'Transcription audio et tri d’images', en: 'Audio transcription and image sorting' },
      { fr: 'Automatisation des tâches répétitives', en: 'Automation of repetitive tasks' },
    ],
  },
];

/* ---------- Réalisations ---------- */
export type Work = { name: L; kind: L; frame: L; text: L; cover: CoverId };

export const works: Work[] = [
  {
    name: { fr: 'Refonte d’une boutique en ligne', en: 'Online shop redesign' },
    kind: { fr: 'Boutique en ligne', en: 'Online shop' },
    frame: { fr: 'Mission freelance, client anonyme', en: 'Freelance job, anonymous client' },
    text: {
      fr: 'Audit du site, maquettes Figma, puis refonte visuelle de toutes les pages d’une boutique WordPress / WooCommerce.',
      en: 'Site audit, Figma mockups, then a visual redesign of every page of a WordPress / WooCommerce shop.',
    },
    cover: 'shop',
  },
  {
    name: { fr: 'JAPPO', en: 'JAPPO' },
    kind: { fr: 'Plateforme web', en: 'Web platform' },
    frame: { fr: 'Projet de certification, conçu seul', en: 'Certification project, built solo' },
    text: {
      fr: 'Plateforme de suivi pour incubateurs : enquête auprès des utilisateurs, design system, application web et assistant IA.',
      en: 'Tracking platform for incubators: user research, design system, web application and AI assistant.',
    },
    cover: 'jappo',
  },
  {
    name: { fr: 'Eco-Stock', en: 'Eco-Stock' },
    kind: { fr: 'Tableau de bord', en: 'Dashboard' },
    frame: { fr: 'Projet de formation, conçu seul', en: 'Training project, built solo' },
    text: {
      fr: 'Suivi des entrepôts, des produits et des transferts de stock pour une logistique du don alimentaire.',
      en: 'Tracking of warehouses, products and stock transfers for food-donation logistics.',
    },
    cover: 'eco',
  },
  {
    name: { fr: 'TerangaScan', en: 'TerangaScan' },
    kind: { fr: 'Application mobile', en: 'Mobile app' },
    frame: { fr: 'Hackathon, équipe de 4', en: 'Hackathon, team of 4' },
    text: {
      fr: 'Application de terrain pour les agents de l’état civil, avec tableau de bord web. J’ai conçu et développé l’interface mobile.',
      en: 'Field app for civil registry agents, with a web dashboard. I designed and built the mobile interface.',
    },
    cover: 'teranga',
  },
];

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

/* ---------- Questions fréquentes ---------- */
export const faq: { q: L; a: L }[] = [
  {
    q: { fr: 'Combien coûte un site ?', en: 'How much does a website cost?' },
    a: {
      fr: 'Le prix dépend du nombre de pages et des fonctionnalités. Après un premier échange, vous recevez un devis détaillé.',
      en: 'The price depends on the number of pages and the features. After a first conversation, you receive a detailed quote.',
    },
  },
  {
    q: { fr: 'Combien de temps faut-il ?', en: 'How long does it take?' },
    a: {
      fr: 'Le délai dépend du projet. Il est fixé avec vous et inscrit dans le devis.',
      en: 'The timeline depends on the project. It is agreed with you and written into the quote.',
    },
  },
  {
    q: { fr: 'J’ai déjà un site. Pouvez-vous l’améliorer ?', en: 'I already have a site. Can you improve it?' },
    a: {
      fr: 'Oui. Je commence par un audit, puis je propose une refonte ou des corrections ciblées.',
      en: 'Yes. I start with an audit, then propose a redesign or targeted fixes.',
    },
  },
  {
    q: { fr: 'Travaillez-vous à distance ?', en: 'Do you work remotely?' },
    a: {
      fr: 'Oui. Je suis basé à Dakar et je travaille aussi à distance.',
      en: 'Yes. I am based in Dakar and also work remotely.',
    },
  },
  {
    q: { fr: 'Que se passe-t-il après la mise en ligne ?', en: 'What happens after launch?' },
    a: {
      fr: 'Je vous montre comment modifier vos contenus. Si vous le souhaitez, on convient ensuite d’un suivi.',
      en: 'I show you how to edit your content. If you wish, we then agree on follow-up support.',
    },
  },
];

/**
 * Avis clients. Vide pour l'instant : la section n'apparaît que si tu en ajoutes de vrais,
 * avec l'accord de la personne. Exemple : { quote: {fr: '…', en: '…'}, author: 'Prénom, gérante d’une boutique' }
 */
export const testimonials: { quote: L; author: string }[] = [];
