import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { serverClient } from '@/lib/supabase/server';
import { checkAdmin } from '@/lib/auth-check';

/**
 * À appeler en tête de CHAQUE page, route et server action de l'admin, même si proxy.ts a déjà vérifié :
 * le proxy peut être contourné (matcher, appel direct d'une action), pas cette vérification.
 * Renvoie le client Supabase de la session : les écritures passent ensuite par RLS (is_admin()).
 * Sinon : redirection vers /admin/login.
 */
export const requireAdmin = cache(async () => {
  const supabase = await serverClient();
  const check = await checkAdmin(supabase);
  if (!check.ok) redirect('/admin/login');
  return { supabase, userId: check.userId, email: check.email };
});
