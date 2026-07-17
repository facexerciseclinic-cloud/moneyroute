import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments/stripe";
import { grantEntitlement } from "@/lib/persistence/entitlements";

export const runtime = "nodejs";

/**
 * POST /api/payments/webhook
 * Receives payment provider webhooks. On a completed checkout, marks the order
 * paid and grants the associated entitlement. Idempotent.
 *
 * The raw request body is required for signature verification, so we read it
 * with request.text() (do NOT parse before verifying).
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  if (!provider) {
    return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = await provider.parseWebhook(payload, signature);
  } catch {
    // Invalid signature — reject.
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Not an event we act on (still acknowledge with 200).
  if (!event) return NextResponse.json({ received: true });

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }

  const orderId = event.metadata.order_id;
  const userId = event.metadata.user_id;
  const entitlementKey = event.metadata.entitlement_key;

  if (!orderId || !userId || !entitlementKey) {
    // Nothing to reconcile — acknowledge to stop retries.
    return NextResponse.json({ received: true });
  }

  // Mark the order paid (only if still pending — idempotent).
  const { data: order } = await admin
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id, user_id")
    .maybeSingle();

  // Grant the entitlement (idempotent by source order). Runs even if the order
  // was already marked paid on a redelivered event.
  await grantEntitlement(admin, {
    userId: order?.user_id ?? userId,
    entitlementKey,
    sourceOrderId: orderId,
  });

  return NextResponse.json({ received: true });
}
