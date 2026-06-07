import Stripe from "stripe";
import { normalizePlanId, type PlanId } from "@secretlayer/shared";
import type { User } from "../store.js";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function priceIdForPlan(plan: PlanId): string | undefined {
  if (plan === "personal") return process.env.STRIPE_PRICE_PERSONAL;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO;
  return undefined;
}

export async function ensureStripeCustomer(stripe: Stripe, user: User): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });
  user.stripeCustomerId = customer.id;
  return customer.id;
}

export async function createCheckoutSession(
  user: User,
  plan: PlanId,
  webOrigin: string,
): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");

  const priceId = priceIdForPlan(plan);
  if (!priceId) throw new Error(`No Stripe price configured for plan: ${plan}`);

  const customerId = await ensureStripeCustomer(stripe, user);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${webOrigin}/app?billing=success`,
    cancel_url: `${webOrigin}/app?billing=cancel`,
    metadata: { userId: user.id, plan },
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
  });

  if (!session.url) throw new Error("Stripe checkout session missing URL.");
  return session.url;
}

export async function createPortalSession(user: User, webOrigin: string): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured.");
  if (!user.stripeCustomerId) throw new Error("No Stripe customer on file.");

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${webOrigin}/app`,
  });
  return session.url;
}

export function planFromStripeSubscription(sub: Stripe.Subscription): PlanId {
  const meta = sub.metadata?.plan;
  if (meta) return normalizePlanId(meta);
  const priceId = sub.items.data[0]?.price?.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId && priceId === process.env.STRIPE_PRICE_PERSONAL) return "personal";
  return "personal";
}
