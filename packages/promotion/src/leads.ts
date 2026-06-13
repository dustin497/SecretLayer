import type { LeadIntent, LeadSource, NurtureTouchpoint, PromotionLead } from "@secretlayer/shared";

const PURPOSE_COPY: Record<LeadIntent, string> = {
  "early-access": "Get vault sync, safety scanner, and promotion gates before public launch.",
  "pro-upgrade": "Unlimited secrets and projects with encrypted cloud sync and export.",
  newsletter: "Monthly builder security tips — leak patterns, vault hygiene, ship checklists.",
  "builder-tools": "CLI and GitHub Action to block leaked secrets in PRs.",
};

export function leadValueProposition(intent: LeadIntent): string {
  return PURPOSE_COPY[intent];
}

export function nurtureSequenceForLead(lead: PromotionLead): NurtureTouchpoint[] {
  const base = leadValueProposition(lead.intent);
  return [
    {
      day: 0,
      subject: "Welcome to SecretLayer — secrets that stay organized",
      body: `Thanks for joining from ${lead.source}. ${base}`,
      cta: "Create your first vault at https://secretlayer.net",
    },
    {
      day: 2,
      subject: "Projects → vaults: the builder mental model",
      body: "Stop mixing client keys with side-project tokens. One project per app, vaults per environment.",
      cta: "Organize a project",
    },
    {
      day: 5,
      subject: "Safety nets before promotion",
      body: "SecretLayer scans for AWS, GitHub, Stripe, and DB leaks before anything goes live.",
      cta: "Run a safety scan",
    },
  ];
}

export function scoreLead(lead: PromotionLead): number {
  let score = 50;
  if (lead.intent === "pro-upgrade") score += 25;
  if (lead.intent === "early-access") score += 15;
  if (lead.source === "vault-demo" || lead.source === "safety-scanner") score += 20;
  if (lead.message && lead.message.length > 20) score += 10;
  return Math.min(100, score);
}

export function promotionLeadSummary(leads: PromotionLead[]): string {
  const hot = leads.filter((l) => scoreLead(l) >= 70 && !l.nurturedAt);
  return [
    `Total leads: ${leads.length}`,
    `High-intent (score ≥70): ${hot.length}`,
    ...hot.slice(0, 5).map((l) => `• ${l.email} (${l.source}/${l.intent})`),
  ].join("\n");
}
