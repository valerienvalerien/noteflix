import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

/**
 * Crée un client Supabase portant le JWT de l'appelant : la RLS s'applique donc
 * automatiquement (chaque utilisateur n'accède qu'à ses propres lignes).
 */
export function userClient(req: Request): SupabaseClient {
  const authorization = req.headers.get("Authorization") ?? "";
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );
}
