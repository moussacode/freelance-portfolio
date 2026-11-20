/** Adresse publique d'une image du bucket freelance-images (utilisable côté navigateur et serveur). */
export const publicImageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/freelance-images/${path}`;
