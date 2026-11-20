/**
 * Nombre de valeurs différentes entre deux objets (comparaison champ par champ, en profondeur).
 * Sert au compteur « Modifications non enregistrées (n) ».
 */
export function countChanges(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0;
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
  if (Array.isArray(a) && Array.isArray(b)) {
    // Un tableau (ordre, liste de points) compte pour une modification s'il diffère.
    return JSON.stringify(a) === JSON.stringify(b) ? 0 : 1;
  }
  if (isObj(a) && isObj(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let n = 0;
    // `preview` (aperçu local d'une image) accompagne toujours un fichier choisi : déjà compté avec lui.
    for (const k of keys) if (k !== 'preview') n += countChanges(a[k], b[k]);
    return n;
  }
  return 1;
}
