/** Tag du cache de toutes les lectures publiques des tables freelance_*. L'admin l'invalide après chaque modification. */
export const CONTENT_TAG = 'freelance-content';

/** Durée de vie maximale du cache public, en secondes, en plus de l'invalidation par tag. */
export const CONTENT_REVALIDATE = 3600;
