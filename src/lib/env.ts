/**
 * Environment configuration & feature detection.
 *
 * Supabase is OPTIONAL: the app runs fully without it (assessment + scoring
 * work statelessly). When these vars are present, persistence is enabled.
 * This keeps Vercel builds/deploys green even before Supabase is set up.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // Server-only. Never exposed to the browser.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  // Stripe (server-only). Payments are OPTIONAL — absent config disables checkout.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
};

/** True when public Supabase config (URL + anon key) is available. */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** True when server-side persistence (service role) is available. */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

/** True when Stripe payments are configured (secret key present). */
export function isStripeConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}
