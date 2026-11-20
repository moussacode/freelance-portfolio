# Règles du projet (pour Claude Code)

Site freelance de Moussa Ali Mchangama (MoussaCode) : une page, faite pour amener un client à le contacter.
Next.js App Router, TypeScript strict, GSAP. Pas de Tailwind, pas de Three.js : CSS à la main dans `src/styles/`.

## Garde-fous, à respecter à chaque modification
- La promesse, les services et les boutons de contact sont visibles sans JavaScript et sans attendre d'animation.
  Ne jamais cacher du contenu en CSS en attendant une animation : animer avec `gsap.from` après le rendu.
- Toute animation passe par `motionOK()` (src/lib/gsap.ts). En version calme, rien ne bouge.
- Chaque section doit mener à une action de contact (WhatsApp, devis, e-mail). Pas de section décorative.
- Accessibilité : focus visible, cibles de 44 px minimum, champs avec libellé, contraste AA dans les deux thèmes.
- Pas de nom de client, pas d'avis ni de chiffre inventé, pas de prix sans l'accord de Moussa.
- Textes d'interface : `src/content/ui.ts` (fr, en). Contenu fixe (identité, raisons, méthode) : `src/content/site.ts`.
- Contenu modifiable (services, réalisations, questions, avis, réglages de contact) : Supabase, tables `freelance_*`,
  lu par `src/lib/content.ts`, avec `src/content/fallback.ts` en repli. Liens WhatsApp et e-mail : `src/lib/contact.ts` uniquement.

## Identité : design system « Studio clair » (le même que les carousels de Moussa)
- Couleurs : fond #F5F2EC, encre #0B1F2A, teal #006989, ambre #FFB400, texte secondaire #5B6B73, carte #FFFFFF,
  erreur #E5484D (badge d'erreur uniquement). En sombre, l'encre devient le fond.
- Une seule forme ambre par écran. Un seul passage en teal par titre (crochets dans le texte, composant `Accented`).
- Polices : Bricolage Grotesque ExtraBold pour les titres (interlettrage -2 %), Inter pour le texte.
- Fond quadrillé (lignes encre à 5 %), cartes blanches rayon 28 px, tags en pill encre avec point ambre.
- Le verre (`.glass`) est réservé à ce qui flotte : barre, panneaux, fenêtres.
- Pas de dégradé décoratif, pas d'ombre dure, pas de chiffre inventé.
- Source : fichier Figma `XvQegq23E3o23RAQDAGzy2`, page « Design System — Studio clair ».

## Vérifier
`npm run build` doit passer sans erreur avant chaque commit.
