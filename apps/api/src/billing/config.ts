import { PLAN_CATALOG, type PlanId } from "@secretlayer/shared";
import { hasPaymentLinks, paymentLinkForPlan } from "./paymentLinks.js";
import { stripeConfigured } from "./stripe.js";

export function getBillingPublicConfig() {
  const plans: PlanId[] = ["personal", "pro"];
  return {
    mode: stripeConfigured() ? "api" : hasPaymentLinks() ? "payment_link" : "unconfigured",
    mirrorpathReference: "https://buy.stripe.com/bJebJ1dTlfnvdCn4aZbV600",
    dashboard: {
      home: "https://dashboard.stripe.com",
      paymentLinks: "https://dashboard.stripe.com/payment-links",
      apiKeys: "https://dashboard.stripe.com/apikeys",
      webhooks: "https://dashboard.stripe.com/webhooks",
      payouts: "https://dashboard.stripe.com/settings/payouts",
      onboarding: "https://dashboard.stripe.com/account/onboarding",
    },
    plans: plans.map((id) => ({
      id,
      name: PLAN_CATALOG[id].name,
      priceLabel: PLAN_CATALOG[id].priceLabel,
      paymentLinkConfigured: Boolean(paymentLinkForPlan(id)),
    })),
    configured: stripeConfigured() || hasPaymentLinks(),
  };
}
