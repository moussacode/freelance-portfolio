import type { SupabaseClient } from '@supabase/supabase-js';

export type AdminCheck =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; reason: 'anonymous' | 'mfa' | 'forbidden' };

/**
 * Vérification d'accès à l'admin, partagée par proxy.ts et requireAdmin().
 * 1. auth.getUser() : le jeton est validé par le serveur Supabase (jamais getSession() seul).
 * 2. Niveau d'authentification aal2 : mot de passe + code TOTP.
 * 3. is_admin() : l'utilisateur est dans la table admins (fonction SQL, security definer).
 * Pas de `server-only` ici : ce fichier est aussi chargé par proxy.ts.
 */
export async function checkAdmin(supabase: SupabaseClient): Promise<AdminCheck> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { ok: false, reason: 'anonymous' };

  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || aal?.currentLevel !== 'aal2') return { ok: false, reason: 'mfa' };

  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin');
  if (rpcError || isAdmin !== true) return { ok: false, reason: 'forbidden' };

  return { ok: true, userId: data.user.id, email: data.user.email ?? null };
}
