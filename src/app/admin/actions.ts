'use server';

import { redirect } from 'next/navigation';
import { serverClient } from '@/lib/supabase/server';

/**
 * Déconnexion : révoque la session côté Supabase et supprime les cookies de session.
 * scope 'local' : seule cette session est fermée. Le compte est partagé avec l'admin du portfolio,
 * une déconnexion 'global' fermerait aussi celle-là.
 * Pas de requireAdmin() ici : se déconnecter doit marcher même avec une session incomplète (aal1).
 */
export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/admin/login');
}
