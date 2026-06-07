import type { PlanId } from "@secretlayer/shared";

/** Mirror Path AI uses Stripe Payment Links (buy.stripe.com) — same pattern supported here. */
export function paymentLinkForPlan(plan: PlanId): string | undefined {
  if (plan === "personal") return process.env.STRIPE_PAYMENT_LINK_PERSONAL;
  if (plan === "pro") return process.env.STRIPE_PAYMENT_LINK_PRO;
  return undefined;
}

export function buildPaymentLinkUrl(plan: PlanId, user: { id: string; email: string }): string | undefined {
  const base = paymentLinkForPlan(plan);
  if (!base) return undefined;
  const url = new URL(base);
  url.searchParams.set("client_reference_id", user.id);
  url.searchParams.set("prefilled_email", user.email);
  return url.toString();
}

export function hasPaymentLinks(): boolean {
  return Boolean(process.env.STRIPE_PAYMENT_LINK_PERSONAL || process.env.STRIPE_PAYMENT_LINK_PRO);
}
