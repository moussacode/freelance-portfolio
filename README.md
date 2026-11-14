# MoussaCode, site freelance

Site d'une seule page pour trouver des clients : la promesse, les services, quelques réalisations, la méthode,
les questions fréquentes et un formulaire qui envoie le brief sur WhatsApp ou par e-mail.
Même design system que le portfolio et les carousels (« Studio clair »). Next.js, GSAP. Pas de 3D : le site reste léger.

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:3000 (redirige vers /fr)
npm run build      # à lancer avant de pousser
```

## Mettre en ligne
Crée un dépôt GitHub à part (par exemple `moussacode-freelance`), pousse le projet, puis importe-le sur Vercel.
Une fois l'adresse connue, mets-la dans `site` (fichier `src/content/site.ts`) pour le référencement.

## Où modifier quoi

| Je veux changer… | Fichier |
| --- | --- |
| Numéro WhatsApp, e-mail, liens, point « disponible » | `person` dans `src/content/site.ts` |
| Les services | `services` dans `src/content/site.ts` |
| Les réalisations | `works` dans `src/content/site.ts` |
| Les étapes, les questions fréquentes | `steps`, `faq` dans `src/content/site.ts` |
| Ajouter des avis clients | `testimonials` dans `src/content/site.ts` (la section apparaît dès qu'il y en a un) |
| Titres, boutons, messages WhatsApp pré-remplis | `src/content/ui.ts` |
| Couleurs, polices, grille | `src/styles/tokens.css` |

Dans un titre, les crochets marquent le passage en teal : `'Un site qui vous [ramène des clients].'`

## Comment le site amène au contact
- Bouton WhatsApp dès l'accueil, avec un message déjà écrit.
- Bouton « Demander un devis » toujours visible dans la barre ; sur téléphone, un bouton WhatsApp reste en bas de l'écran.
- Chaque service a son bouton, qui ouvre WhatsApp avec le nom du service.
- Le formulaire ne stocke rien : il compose le message et l'ouvre dans WhatsApp ou dans la messagerie.
- Pour retirer WhatsApp partout, mets `whatsapp: ''` : les boutons passent sur le formulaire et l'e-mail.

## À ne pas faire
Pas de nom de client, pas de chiffre ni d'avis inventé, pas de prix affiché sans décision de Moussa.
