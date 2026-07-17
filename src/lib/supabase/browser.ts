"use client";
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Auth-aware browser client. Returns null when Supabase is not configured
 * so UI can degrade gracefully.
 */
export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
