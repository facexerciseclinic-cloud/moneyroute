import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Privileged server-side client using the service role key.
 * Bypasses RLS — only use in trusted server code (API routes, server actions).
 * NEVER import this into client components.
 *
 * Returns null when Supabase admin config is absent, so callers can no-op
 * gracefully (the app works without a database).
 */
export function createSupabaseAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
