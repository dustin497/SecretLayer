export { SECRET_PATTERNS, REQUIRED_SECURITY_HEADERS, type SecretPattern } from "./patterns.js";

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
  | "email-waitlist"
  | "lead-nurture";

export type LeadSource = "landing" | "waitlist" | "safety-scanner" | "vault-demo" | "changelog";
export type LeadIntent = "early-access" | "pro-upgrade" | "newsletter" | "builder-tools";

export interface PromotionLead {
  id: string;
  email: string;
  source: LeadSource;
  intent: LeadIntent;
  message?: string;
  createdAt: string;
  nurturedAt?: string;
}

export interface NurtureTouchpoint {
  day: number;
  subject: string;
  body: string;
  cta: string;
}

export interface VaultItemRecord {
  clientId: string;
  userId: string;
  label: string;
  encryptedBlob: unknown;
  encryptionMeta: {
    clientEncrypted: boolean;
    algorithm: string;
    syncedBy: string;
  };
  updatedAt: string;
}

export interface PromotionPlan {
  channels: PromotionChannel[];
  headline: string;
  body: string;
  safetyReportId: string;
}

export interface PromotionResult {
  approved: boolean;
  reason: string;
  plan?: PromotionPlan;
  executedAt?: string;
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

export interface PlanLimits {
  secrets: number;
  projects: number;
}

export const FREE_PLAN_LIMITS: PlanLimits = { secrets: 10, projects: 3 };
