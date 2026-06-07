import type { PromotionChannel, PromotionPlan, SafetyReport } from "@secretlayer/shared";
import { buildPromotionLeads } from "./leads.js";

export interface PromotionInput {
  version: string;
  highlights: string[];
  safetyReport: SafetyReport;
}

const DEFAULT_CHANNELS: PromotionChannel[] = [
  "changelog",
  "marketing-site",
  "social-announcement",
  "email-waitlist",
];

export function buildPromotionPlan(input: PromotionInput): PromotionPlan {
  const { version, highlights, safetyReport } = input;
  const headline = `SecretLayer ${version} — builder-grade vaults, verified safe`;
  const leads = buildPromotionLeads({
    version,
    highlights,
    safetyScore: safetyReport.score,
    targetUrl: safetyReport.target,
  });

  const body = [
    `Safety score: ${safetyReport.score}/100 (${safetyReport.passed ? "cleared" : "blocked"})`,
    "",
    "What's new:",
    ...highlights.map((h) => `• ${h}`),
    "",
    "Promotion leads ready:",
    ...leads.map((l) => `• [${l.channel}] ${l.title}`),
    "",
    "Built for builders who organize secrets into projects and vaults — encrypted before sync, scanned before ship.",
    "",
    safetyReport.target,
  ].join("\n");

  return {
    channels: DEFAULT_CHANNELS,
    headline,
    body,
    safetyReportId: safetyReport.runAt,
    leads,
  };
}
