import {
  isWithinLimit,
  limitsForPlan,
  planToApiLabel,
  type PlanId,
} from "@secretlayer/shared";
import { projects, vaultItems, type User } from "../store.js";

export interface BillingPlanResponse {
  plan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  limits: { secrets: number | null; projects: number | null };
  usage: { secrets: number; projects: number };
}

export function usageForUser(userId: string) {
  return {
    secrets: [...vaultItems.values()].filter((v) => v.userId === userId).length,
    projects: [...projects.values()].filter((p) => p.userId === userId).length,
  };
}

export function buildBillingPlanResponse(user: User): BillingPlanResponse {
  const usage = usageForUser(user.id);
  const limits = limitsForPlan(user.plan);
  return {
    plan: planToApiLabel(user.plan),
    subscriptionStatus: user.subscriptionStatus ?? null,
    currentPeriodEnd: user.currentPeriodEnd ?? null,
    hasStripeCustomer: Boolean(user.stripeCustomerId),
    limits,
    usage,
  };
}

export function assertProjectAllowed(user: User): string | null {
  const usage = usageForUser(user.id);
  const limits = limitsForPlan(user.plan);
  if (!isWithinLimit(usage.projects, limits.projects)) {
    return "Project limit reached. Upgrade to Personal or Pro for unlimited projects.";
  }
  return null;
}

export function assertSecretAllowed(user: User, isNew: boolean): string | null {
  if (!isNew) return null;
  const usage = usageForUser(user.id);
  const limits = limitsForPlan(user.plan);
  if (!isWithinLimit(usage.secrets, limits.secrets)) {
    return "Secret limit reached. Upgrade to Personal or Pro for unlimited secrets.";
  }
  return null;
}

export function applySubscriptionToUser(
  user: User,
  data: {
    plan: PlanId;
    subscriptionStatus?: string | null;
    currentPeriodEnd?: string | null;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  },
): void {
  user.plan = data.plan;
  user.subscriptionStatus = data.subscriptionStatus ?? user.subscriptionStatus;
  user.currentPeriodEnd = data.currentPeriodEnd ?? user.currentPeriodEnd;
  if (data.stripeCustomerId) user.stripeCustomerId = data.stripeCustomerId;
  if (data.stripeSubscriptionId) user.stripeSubscriptionId = data.stripeSubscriptionId;
}
