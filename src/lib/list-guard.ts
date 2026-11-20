import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Avant d'enregistrer une liste (services, questions…), vérifie qu'elle est COMPLÈTE :
 * chaque élément en base doit être soit dans la liste envoyée, soit dans les suppressions.
 * La fonction SQL donne les positions 0, 1, 2… dans l'ordre reçu : un élément oublié garderait
 * son ancienne position et créerait un doublon dans l'ordre du site.
 * Renvoie un message d'erreur, ou null si tout est cohérent.
 */
export async function checkCompleteList(
  supabase: SupabaseClient,
  table: string,
  sentIds: (string | null)[],
  deleted: string[],
): Promise<string | null> {
  const ids = sentIds.filter((id): id is string => Boolean(id));
  const sent = new Set(ids);
  const del = new Set(deleted);

  if (sent.size !== ids.length) return 'Un élément apparaît deux fois dans la liste. Rechargez la page.';
  if (deleted.some((id) => sent.has(id))) return 'Un élément est à la fois gardé et supprimé. Rechargez la page.';

  const { data, error } = await supabase.from(table).select('id');
  if (error || !data) return 'Lecture de la liste impossible. Réessayez.';
  const existing = new Set(data.map((r: { id: string }) => r.id));

  const forgotten = [...existing].filter((id) => !sent.has(id) && !del.has(id));
  const unknown = [...sent, ...del].filter((id) => !existing.has(id));
  if (forgotten.length || unknown.length) {
    return 'La liste a changé depuis l’ouverture de la page (autre onglet ?). Rechargez la page avant d’enregistrer : rien n’a été modifié.';
  }
  return null;
}
