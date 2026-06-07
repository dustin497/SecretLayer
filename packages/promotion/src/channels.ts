import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PromotionPlan, PromotionChannel } from "@secretlayer/shared";

export interface ChannelResult {
  channel: PromotionChannel;
  ok: boolean;
  detail: string;
}

export interface ExecuteOptions {
  repoRoot?: string;
  netlifyHookUrl?: string;
  dryRun?: boolean;
}

export async function executePromotionChannels(
  plan: PromotionPlan,
  options: ExecuteOptions = {},
): Promise<ChannelResult[]> {
  const root = options.repoRoot ?? process.cwd();
  const outDir = resolve(root, "promotion-output");
  mkdirSync(outDir, { recursive: true });
  const results: ChannelResult[] = [];

  for (const channel of plan.channels) {
    switch (channel) {
      case "changelog":
        results.push(applyChangelog(plan, root, options.dryRun));
        break;
      case "marketing-site":
        results.push({ channel, ok: true, detail: "Marketing copy staged in promotion output." });
        writeFileSync(resolve(outDir, "latest-marketing.md"), `# ${plan.headline}\n\n${plan.body}\n`);
        break;
      case "social-announcement":
        results.push({ channel, ok: true, detail: "Social drafts written." });
        writeFileSync(resolve(outDir, "social.md"), socialDrafts(plan));
        break;
      case "email-waitlist":
      case "lead-nurture":
        results.push({ channel, ok: true, detail: "Lead nurture sequence generated." });
        writeFileSync(resolve(outDir, "lead-nurture.md"), leadNurtureCopy(plan));
        break;
      case "deploy-production": {
        const hook = options.netlifyHookUrl ?? process.env.NETLIFY_BUILD_HOOK;
        if (!hook) {
          results.push({ channel, ok: false, detail: "NETLIFY_BUILD_HOOK not set." });
          break;
        }
        if (options.dryRun) {
          results.push({ channel, ok: true, detail: `Would POST to Netlify hook (${hook.slice(0, 40)}…).` });
          break;
        }
        const res = await fetch(hook, { method: "POST" });
        results.push({
          channel,
          ok: res.ok,
          detail: res.ok ? "Netlify production deploy triggered." : `Deploy hook failed: ${res.status}`,
        });
        break;
      }
      default:
        results.push({ channel, ok: false, detail: "Unknown channel." });
    }
  }

  return results;
}

function applyChangelog(plan: PromotionPlan, root: string, dryRun?: boolean): ChannelResult {
  const file = resolve(root, "CHANGELOG.md");
  const entry = `\n## ${plan.headline.split("—")[0].trim()}\n\n${plan.body}\n`;
  if (dryRun) {
    return { channel: "changelog", ok: true, detail: "Would append CHANGELOG.md entry." };
  }
  const existing = existsSync(file) ? readFileSync(file, "utf8") : "# Changelog\n";
  if (!existing.includes(plan.headline)) {
    appendFileSync(file, entry);
  }
  return { channel: "changelog", ok: true, detail: "CHANGELOG.md updated." };
}

function socialDrafts(plan: PromotionPlan): string {
  return [
    `## X / Twitter\n${plan.headline}\n\nOrganize builder secrets in encrypted vaults. Safety-checked before ship.\nhttps://secretlayer.net\n`,
    `## LinkedIn\n${plan.body}\n`,
    `## Hacker News (Show HN)\nShow HN: SecretLayer – vault-first secrets for indie builders\n\n${plan.body}\n`,
  ].join("\n---\n\n");
}

function leadNurtureCopy(plan: PromotionPlan): string {
  return [
    "# Lead nurture sequence (post-safety-clearance)",
    "",
    "## Day 0 — Welcome",
    `Subject: Your builder vault is ready`,
    `Body: You joined SecretLayer because scattered API keys slow you down. ${plan.headline}`,
    `CTA: Create your first project → https://secretlayer.net`,
    "",
    "## Day 3 — Safety nets",
    "Subject: Scan before you ship",
    "Body: Run the safety scanner on paste buffers and repos. Promotion only fires when checks pass.",
    "CTA: Open safety scanner",
    "",
    "## Day 7 — Projects → vaults",
    "Subject: Organize like a pro (without enterprise bloat)",
    "Body: Group secrets by client, app, and environment. Encrypt locally before sync.",
    "CTA: Add a vault item",
  ].join("\n");
}
