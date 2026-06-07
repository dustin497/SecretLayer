import type Stripe from "stripe";
// Stripe subscription period fields remain snake_case in webhook payloads.
import type { BillingPlanId } from "@secretlayer/shared";
import type { BillingUser } from "./stripe.js";

export interface BillingStore {
  getUserById(userId: string): BillingUser | undefined;
  getUserByStripeCustomerId(customerId: string): BillingUser | undefined;
}

function planFromMetadata(metadata: Stripe.Metadata | null | undefined): BillingPlanId | null {
  const plan = metadata?.plan;
  if (plan === "PERSONAL" || plan === "PRO") return plan;
  return null;
}

export function applyStripeEvent(event: Stripe.Event, store: BillingStore): void {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const user =
        (session.metadata?.userId ? store.getUserById(session.metadata.userId) : undefined) ??
        (session.customer ? store.getUserByStripeCustomerId(String(session.customer)) : undefined);
      if (!user) return;

      if (session.customer && typeof session.customer === "string") {
        user.stripeCustomerId = session.customer;
      }

      const plan = planFromMetadata(session.metadata);
      if (plan) user.plan = plan;
      user.subscriptionStatus = "active";
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const user =
        (subscription.metadata?.userId ? store.getUserById(subscription.metadata.userId) : undefined) ??
        store.getUserByStripeCustomerId(String(subscription.customer));
      if (!user) return;

      user.stripeCustomerId = String(subscription.customer);
      user.subscriptionStatus = subscription.status;
      const periodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
      user.currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

      const plan = planFromMetadata(subscription.metadata);
      if (plan && subscription.status === "active") user.plan = plan;
      if (subscription.status === "canceled" || subscription.status === "unpaid") {
        user.plan = "FREE";
      }
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const user = store.getUserByStripeCustomerId(String(subscription.customer));
      if (!user) return;

      user.plan = "FREE";
      user.subscriptionStatus = "canceled";
      user.currentPeriodEnd = null;
      break;
    }
    default:
      break;
  }
}
