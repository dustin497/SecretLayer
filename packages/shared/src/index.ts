export type SafetySeverity = "info" | "warn" | "critical";

export type SafetyCheckId =
  | "secret-leak-scan"
  | "encryption-at-rest"
  | "transport-security"
  | "auth-hardening"
  | "csp-headers"
  | "dependency-audit"
  | "vault-structure"
  | "rate-limiting"
  | "audit-logging";

export interface SafetyFinding {
  checkId: SafetyCheckId;
  severity: SafetySeverity;
  passed: boolean;
  title: string;
  detail: string;
  remediation?: string;
}

export interface SafetyReport {
  runAt: string;
  target: string;
  passed: boolean;
  score: number;
  findings: SafetyFinding[];
  blockers: SafetyFinding[];
}

export type PromotionChannel =
  | "deploy-production"
  | "marketing-site"
  | "social-announcement"
  | "changelog"
  | "email-waitlist";

export interface PromotionLead {
  channel: PromotionChannel;
  title: string;
  content: string;
  cta?: string;
}

export interface PromotionPlan {
  channels: PromotionChannel[];
  headline: string;
  body: string;
  safetyReportId: string;
  leads: PromotionLead[];
}

export interface PromotionResult {
  approved: boolean;
  reason: string;
  plan?: PromotionPlan;
  executedAt?: string;
}

export interface WaitlistLead {
  id: string;
  email: string;
  source: string;
  createdAt: string;
}

export interface VaultProject {
  id: string;
  name: string;
  description?: string;
  vaultIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Vault {
  id: string;
  projectId: string;
  label: string;
  itemCount: number;
  encrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BillingPlanId = "FREE" | "PERSONAL" | "PRO";

export interface PlanLimits {
  secrets: number;
  projects: number;
}

export const FREE_PLAN_LIMITS: PlanLimits = { secrets: 10, projects: 3 };
export const PERSONAL_PLAN_LIMITS: PlanLimits = { secrets: Number.MAX_SAFE_INTEGER, projects: Number.MAX_SAFE_INTEGER };
export const PRO_PLAN_LIMITS: PlanLimits = { secrets: Number.MAX_SAFE_INTEGER, projects: Number.MAX_SAFE_INTEGER };

export interface BillingPlanResponse {
  plan: BillingPlanId;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  limits: PlanLimits;
  usage: { secrets: number; projects: number };
}
