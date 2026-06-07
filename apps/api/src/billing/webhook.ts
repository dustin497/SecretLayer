import type Stripe from "stripe";
import { normalizePlanId, type PlanId } from "@secretlayer/shared";
import { audit, getUser, users } from "../store.js";
import { applySubscriptionToUser } from "./plan.js";
import { getStripe, planFromStripeSubscription } from "./stripe.js";

function inferPlanFromSession(session: Stripe.Checkout.Session): PlanId {
  if (session.metadata?.plan) return normalizePlanId(session.metadata.plan);
  return "personal";
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) throw new Error("Stripe webhook not configured.");

  const event = stripe.webhooks.constructEvent(rawBody, signature ?? "", secret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;
      if (!userId) break;
      const user = getUser(userId);
      if (!user) break;
      const plan = normalizePlanId(
        session.metadata?.plan ?? inferPlanFromSession(session),
      );
      applySubscriptionToUser(user, {
        plan,
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        subscriptionStatus: "active",
      });
      audit("billing.checkout.completed", plan, userId);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      let user = userId ? getUser(userId) : undefined;
      if (!user) {
        user = [...users.values()].find((u) => u.stripeCustomerId === sub.customer);
      }
      if (!user) break;

      if (event.type === "customer.subscription.deleted" || sub.status === "canceled") {
        applySubscriptionToUser(user, {
          plan: "free",
          subscriptionStatus: "canceled",
          currentPeriodEnd: null,
          stripeSubscriptionId: undefined,
        });
        audit("billing.subscription.canceled", sub.id, user.id);
        break;
      }

      const periodEndUnix = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;
      const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;
      applySubscriptionToUser(user, {
        plan: planFromStripeSubscription(sub),
        subscriptionStatus: sub.status,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      });
      audit("billing.subscription.updated", sub.status, user.id);
      break;
    }
    default:
      break;
  }
}
