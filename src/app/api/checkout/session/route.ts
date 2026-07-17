import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "@/lib/payments/stripe";

export const runtime = "nodejs";

const BodySchema = z.object({
  productSlug: z.string().min(1).max(64),
  /** Optional session to return to after payment. */
  sessionId: z.string().uuid().optional(),
});

function siteOrigin(request: Request): string {
  if (env.siteUrl) return env.siteUrl.replace(/\/$/, "");
  return new URL(request.url).origin;
}

/**
 * POST /api/checkout/session
 * Creates a pending order and a hosted checkout session for a product.
 * Requires an authenticated user. Returns the URL to redirect the buyer to.
 */
export async function POST(request: Request) {
  const provider = getPaymentProvider();
  if (!provider) {
    return NextResponse.json({ error: "payments_unavailable" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "admin_unavailable" }, { status: 503 });
  }

  // Load the product from the catalog.
  const { data: product, error: productError } = await admin
    .from("products")
    .select("id, slug, name, price, currency, entitlement_key, active")
    .eq("slug", parsed.data.productSlug)
    .eq("active", true)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: "product_not_found" }, { status: 404 });
  }

  // Create a pending order first so the webhook has a row to reconcile.
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: product.id,
      payment_provider: provider.name,
      status: "pending",
      subtotal: product.price,
      total: product.price,
      currency: product.currency,
      metadata: parsed.data.sessionId
        ? { session_id: parsed.data.sessionId }
        : {},
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "order_failed" }, { status: 500 });
  }

  const origin = siteOrigin(request);
  const returnTo = parsed.data.sessionId
    ? `/report/${parsed.data.sessionId}`
    : "/result";

  try {
    const checkout = await provider.createCheckoutSession({
      lineItems: [
        {
          name: product.name,
          amount: product.price,
          currency: product.currency,
          quantity: 1,
        },
      ],
      successUrl: `${origin}${returnTo}?paid=1`,
      cancelUrl: `${origin}/pricing?canceled=1`,
      customerEmail: user.email ?? undefined,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        entitlement_key: product.entitlement_key,
      },
    });

    await admin
      .from("orders")
      .update({ external_payment_id: checkout.id })
      .eq("id", order.id);

    return NextResponse.json({ url: checkout.url });
  } catch {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "checkout_failed" }, { status: 502 });
  }
}
