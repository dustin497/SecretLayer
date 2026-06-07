import type { PromotionChannel, PromotionLead } from "@secretlayer/shared";

export interface LeadInput {
  version: string;
  highlights: string[];
  safetyScore: number;
  targetUrl?: string;
}

const CHANNEL_ORDER: PromotionChannel[] = [
  "changelog",
  "marketing-site",
  "social-announcement",
  "email-waitlist",
  "deploy-production",
];

export function buildPromotionLeads(input: LeadInput): PromotionLead[] {
  const url = input.targetUrl ?? "https://secretlayer.net";
  const headline = `SecretLayer ${input.version} — builder-grade vaults, verified safe`;
  const highlightBullets = input.highlights.map((h) => `• ${h}`).join("\n");

  const changelog = [
    `# SecretLayer ${input.version}`,
    "",
    `Safety score: **${input.safetyScore}/100** — cleared for promotion.`,
    "",
    "## What's new",
    ...input.highlights.map((h) => `- ${h}`),
    "",
    "## Why it matters",
    "Builders juggle secrets across projects. SecretLayer organizes them into encrypted vaults,",
    "runs industry-calibrated safety nets before every ship, and only promotes when checks pass.",
    "",
    `[Try SecretLayer](${url})`,
  ].join("\n");

  const social = [
    `🔐 SecretLayer ${input.version} is live`,
    "",
    ...input.highlights.slice(0, 2).map((h) => `→ ${h}`),
    "",
    `Safety score: ${input.safetyScore}/100 before we shipped.`,
    "Vault-first secrets for the common builder.",
    "",
    url,
  ].join("\n");

  const email = [
    `Subject: ${headline}`,
    "",
    "Hi builder,",
    "",
    `We just shipped SecretLayer ${input.version} after passing our safety gate (${input.safetyScore}/100).`,
    "",
    "What's new:",
    highlightBullets,
    "",
    "Organize API keys and tokens into projects and encrypted vaults.",
    "Nothing promotes until safety nets clear.",
    "",
    `Get started: ${url}`,
    "",
    "— The SecretLayer team",
  ].join("\n");

  const marketing = [
    headline,
    "",
    "Secrets for the common builder — projects, encrypted vaults, and safety nets",
    "that block promotion until the industry bar is met.",
    "",
    highlightBullets,
    "",
    `Safety verified: ${input.safetyScore}/100`,
  ].join("\n");

  const deploy = [
    `Deploy checklist for ${input.version}`,
    "",
    "✓ Safety score ≥ 80 with zero critical blockers",
    "✓ Changelog drafted",
    "✓ Marketing site copy ready",
    "→ Trigger Netlify deploy hook when PROMOTION_WEBHOOK_URL is configured",
  ].join("\n");

  const byChannel: Record<PromotionChannel, PromotionLead> = {
    changelog: {
      channel: "changelog",
      title: `CHANGELOG v${input.version}`,
      content: changelog,
      cta: "Publish to docs/changelog",
    },
    "marketing-site": {
      channel: "marketing-site",
      title: "Homepage hero update",
      content: marketing,
      cta: "Update secretlayer.net hero section",
    },
    "social-announcement": {
      channel: "social-announcement",
      title: "Launch post (X / LinkedIn)",
      content: social,
      cta: "Schedule social post",
    },
    "email-waitlist": {
      channel: "email-waitlist",
      title: "Waitlist announcement",
      content: email,
      cta: "Send to waitlist subscribers",
    },
    "deploy-production": {
      channel: "deploy-production",
      title: "Production deploy",
      content: deploy,
      cta: "Run Netlify deploy hook",
    },
  };

  return CHANNEL_ORDER.map((channel) => byChannel[channel]);
}
