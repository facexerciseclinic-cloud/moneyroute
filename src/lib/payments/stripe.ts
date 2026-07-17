import "server-only";
import Stripe from "stripe";
import { env, isStripeConfigured } from "@/lib/env";
import type {
  CreateCheckoutParams,
  CheckoutResult,
  PaidEvent,
  PaymentProvider,
} from "./provider";

let client: Stripe | null = null;

function stripe(): Stripe {
  if (!client) {
    client = new Stripe(env.stripeSecretKey, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return client;
}

/**
 * Stripe implementation of the PaymentProvider adapter.
 *
 * Uses Stripe Checkout (hosted). Payment method types are intentionally NOT
 * pinned — Checkout displays every method enabled in the Stripe dashboard
 * (card, PromptPay, etc.), so enabling PromptPay is a dashboard-only change.
 */
class StripeProvider implements PaymentProvider {
  readonly name = "stripe";

  async createCheckoutSession(
    params: CreateCheckoutParams,
  ): Promise<CheckoutResult> {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: params.lineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: item.currency,
          unit_amount: item.amount,
          product_data: { name: item.name },
        },
      })),
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: params.metadata,
      payment_intent_data: { metadata: params.metadata },
    });

    if (!session.url) {
      throw new Error("stripe_no_session_url");
    }
    return { id: session.id, url: session.url };
  }

  async parseWebhook(
    payload: string,
    signature: string,
  ): Promise<PaidEvent | null> {
    const event = stripe().webhooks.constructEvent(
      payload,
      signature,
      env.stripeWebhookSecret,
    );

    if (event.type !== "checkout.session.completed") return null;

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return null;

    return {
      type: "checkout.completed",
      sessionId: session.id,
      metadata: (session.metadata ?? {}) as Record<string, string>,
    };
  }
}

/**
 * Returns the configured payment provider, or null when Stripe is not
 * configured (so callers can respond with a 503 rather than crashing).
 */
export function getPaymentProvider(): PaymentProvider | null {
  if (!isStripeConfigured()) return null;
  return new StripeProvider();
}
