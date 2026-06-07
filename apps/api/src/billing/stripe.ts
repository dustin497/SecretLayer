import Stripe from "stripe";
import type { BillingPlanId } from "@secretlayer/shared";
import { checkoutPlanToBillingPlan, priceIdForCheckoutPlan, type CheckoutPlanId } from "./plans.js";

export interface BillingUser {
  id: string;
  email: string;
  stripeCustomerId?: string;
  plan: BillingPlanId;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!secretKey.startsWith("sk_")) {
    console.error("STRIPE_SECRET_KEY must start with sk_test_ or sk_live_ — not pk_ or whsec_.");
    return null;
  }
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function billingConfigured(): boolean {
  return Boolean(getStripe() && process.env.STRIPE_PRICE_ID_PERSONAL && process.env.STRIPE_PRICE_ID_PRO);
}

export async function ensureStripeCustomer(user: BillingUser): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });

  user.stripeCustomerId = customer.id;
  return customer.id;
}

export async function createCheckoutSession(
  user: BillingUser,
  plan: CheckoutPlanId,
  webOrigin: string,
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  const priceId = priceIdForCheckoutPlan(plan);
  if (!priceId) {
    throw new Error(`Missing Stripe price ID for plan "${plan}". Set STRIPE_PRICE_ID_${plan.toUpperCase()}.`);
  }

  const customerId = await ensureStripeCustomer(user);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${webOrigin}/?billing=success`,
    cancel_url: `${webOrigin}/?billing=cancelled`,
    metadata: {
      userId: user.id,
      plan: checkoutPlanToBillingPlan(plan),
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan: checkoutPlanToBillingPlan(plan),
      },
    },
  });

  if (!session.url) throw new Error("Checkout did not return a URL.");
  return session.url;
}

export async function createPortalSession(user: BillingUser, webOrigin: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");
  if (!user.stripeCustomerId) throw new Error("No Stripe customer on file.");

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${webOrigin}/?billing=portal`,
  });

  if (!session.url) throw new Error("Billing portal did not return a URL.");
  return session.url;
}

export function verifyWebhookSignature(payload: Buffer, signature: string | undefined): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe) throw new Error("Stripe is not configured.");
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  if (!signature) throw new Error("Missing Stripe signature.");
  if (!webhookSecret.startsWith("whsec_")) {
    throw new Error("STRIPE_WEBHOOK_SECRET must start with whsec_ — use the webhook signing secret, not an API key.");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
