import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Entitlement key that unlocks the full deterministic report. */
export const INCOME_BLUEPRINT_KEY = "income_blueprint";

/**
 * Returns true when the user holds an active, unexpired entitlement.
 * Returns false when Supabase is unconfigured or on any lookup error.
 */
export async function hasEntitlement(
  userId: string,
  entitlementKey: string,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const { data, error } = await admin
    .from("entitlements")
    .select("id, expires_at")
    .eq("user_id", userId)
    .eq("entitlement_key", entitlementKey)
    .eq("status", "active");

  if (error || !data) return false;

  const now = Date.now();
  return data.some(
    (row) => !row.expires_at || new Date(row.expires_at).getTime() > now,
  );
}

/**
 * Grant an entitlement to a user (idempotent per source order).
 * Uses the provided admin client so it can share the webhook's transaction path.
 */
export async function grantEntitlement(
  admin: SupabaseClient,
  params: {
    userId: string;
    entitlementKey: string;
    sourceOrderId: string;
  },
): Promise<void> {
  // Avoid duplicate grants if the webhook is delivered more than once.
  const { data: existing } = await admin
    .from("entitlements")
    .select("id")
    .eq("source_order_id", params.sourceOrderId)
    .eq("entitlement_key", params.entitlementKey)
    .maybeSingle();

  if (existing) return;

  await admin.from("entitlements").insert({
    user_id: params.userId,
    entitlement_key: params.entitlementKey,
    source_order_id: params.sourceOrderId,
    status: "active",
  });
}
