import type { PromotionResult, SafetyReport } from "@secretlayer/shared";
import { executePromotionChannels, type ChannelResult } from "./channels.js";
import { buildPromotionPlan, type PromotionInput } from "./planner.js";

export interface PromotionGateOptions {
  dryRun?: boolean;
  webhookUrl?: string;
  repoRoot?: string;
  netlifyHookUrl?: string;
}

export async function runPromotionGate(
  input: PromotionInput,
  options: PromotionGateOptions = {},
): Promise<PromotionResult> {
  const { safetyReport } = input;

  if (!safetyReport.passed) {
    return {
      approved: false,
      reason: `Promotion blocked: safety score ${safetyReport.score}/100 with ${safetyReport.blockers.length} critical blocker(s).`,
    };
  }

  const plan = buildPromotionPlan(input);

  const channelResults: ChannelResult[] = await executePromotionChannels(plan, {
    dryRun: options.dryRun,
    repoRoot: options.repoRoot,
    netlifyHookUrl: options.netlifyHookUrl,
  });

  if (options.webhookUrl && !options.dryRun) {
    await fetch(options.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "secretlayer.promotion.approved", plan, safetyReport, channelResults }),
    });
  }

  const failed = channelResults.filter((c) => !c.ok);
  const mode = options.dryRun ? "Dry run — plan generated" : "Promotion executed";

  return {
    approved: failed.length === 0 || options.dryRun === true,
    reason:
      failed.length === 0
        ? `${mode}. Safety nets passed. Channels: ${channelResults.map((c) => c.channel).join(", ")}.`
        : `${mode} with ${failed.length} channel failure(s): ${failed.map((f) => f.channel).join(", ")}.`,
    plan,
    executedAt: new Date().toISOString(),
  };
}

export function assertSafeForPromotion(report: SafetyReport): void {
  if (!report.passed) {
    const titles = report.blockers.map((b) => b.title).join(", ");
    throw new Error(`Cannot promote: safety gate failed (${titles})`);
  }
}
