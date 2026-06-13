export type PlanId = "free" | "personal" | "pro";

export interface PlanLimits {
  secrets: number | null;
  projects: number | null;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
  limits: PlanLimits;
}

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    description: "Local-first vault for getting started.",
    features: ["10 secrets", "3 projects", "Local backup/import", "Basic provider links"],
    limits: { secrets: 10, projects: 3 },
  },
  personal: {
    id: "personal",
    name: "Personal",
    priceLabel: "$4.99/mo",
    description: "Encrypted sync for everyday project work.",
    features: [
      "Unlimited secrets",
      "Unlimited projects",
      "Encrypted cloud sync",
      "Reminders",
      "Export backup",
    ],
    limits: { secrets: null, projects: null },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "$9.99/mo",
    description: "Credential operations for developers, clients, and teams.",
    features: [
      "Everything in Personal",
      "Developer protection workflows",
      "Recovery reports",
      "Advanced provider links",
    ],
    limits: { secrets: null, projects: null },
  },
};

export function normalizePlanId(value: unknown): PlanId {
  const raw = String(value ?? "free").toLowerCase();
  if (raw === "personal" || raw === "pro") return raw;
  return "free";
}

export function planToApiLabel(plan: PlanId): string {
  return plan.toUpperCase();
}

export function limitsForPlan(plan: PlanId): PlanLimits {
  return PLAN_CATALOG[plan].limits;
}

export function isWithinLimit(current: number, limit: number | null): boolean {
  if (limit === null) return true;
  return current < limit;
}

/** @deprecated use limitsForPlan */
export const FREE_PLAN_LIMITS = { secrets: 10, projects: 3 };
