import {
  FREE_PLAN_LIMITS,
  PERSONAL_PLAN_LIMITS,
  PRO_PLAN_LIMITS,
  type BillingPlanId,
  type PlanLimits,
} from "@secretlayer/shared";

export type CheckoutPlanId = "personal" | "pro";

const PLAN_LIMITS: Record<BillingPlanId, PlanLimits> = {
  FREE: FREE_PLAN_LIMITS,
  PERSONAL: PERSONAL_PLAN_LIMITS,
  PRO: PRO_PLAN_LIMITS,
};

export function limitsForPlan(plan: BillingPlanId): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function checkoutPlanToBillingPlan(plan: CheckoutPlanId): BillingPlanId {
  return plan === "personal" ? "PERSONAL" : "PRO";
}

export function priceIdForCheckoutPlan(plan: CheckoutPlanId): string | undefined {
  if (plan === "personal") return process.env.STRIPE_PRICE_ID_PERSONAL;
  return process.env.STRIPE_PRICE_ID_PRO;
}

export function isCheckoutPlanId(value: unknown): value is CheckoutPlanId {
  return value === "personal" || value === "pro";
}
