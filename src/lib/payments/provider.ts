import "server-only";

/**
 * Payment provider adapter interface.
 *
 * Business logic depends on this abstraction, not on Stripe directly, so the
 * provider can be swapped later without touching the checkout/webhook flow.
 */

export type CheckoutLineItem = {
  name: string;
  /** Amount in the smallest currency unit (satang for THB). */
  amount: number;
  currency: string;
  quantity: number;
};

export type CreateCheckoutParams = {
  lineItems: CheckoutLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  /** Passed back verbatim on the webhook event. */
  metadata: Record<string, string>;
};

export type CheckoutResult = {
  /** Provider session id — stored as orders.external_payment_id. */
  id: string;
  /** Hosted payment page URL to redirect the customer to. */
  url: string;
};

export type PaidEvent = {
  type: "checkout.completed";
  /** Provider session id that maps to orders.external_payment_id. */
  sessionId: string;
  metadata: Record<string, string>;
};

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult>;
  /**
   * Verify a webhook payload and return a normalized paid event, or null when
   * the event is not one we act on. Throws when the signature is invalid.
   */
  parseWebhook(payload: string, signature: string): Promise<PaidEvent | null>;
}
