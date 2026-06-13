#!/usr/bin/env node
import { resolve } from "node:path";
import { fetchHeaders, runSafetySuite } from "@secretlayer/safety-engine";
import { runPromotionGate } from "./gate.js";

const args = process.argv.slice(2);
const execute = args.includes("--execute");
const filtered = args.filter((a) => !a.startsWith("--"));
const target = filtered[0] ?? "https://secretlayer.net";
const version = filtered[1] ?? "0.3.0";
const repoRoot = resolve(filtered[2] ?? process.cwd());

async function main() {
  console.log("SecretLayer Promotion Gate\n");

  const headers = await fetchHeaders(target).catch(() => ({}));
  const safetyReport = await runSafetySuite({
    targetUrl: target,
    responseHeaders: headers,
    config: {
      jwtSecretSet: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET !== "change-me-in-production"),
      encryptionEnabled: true,
      rateLimitEnabled: true,
      auditLogEnabled: Boolean(process.env.ADMIN_API_KEY),
    },
  });

  const result = await runPromotionGate(
    {
      version,
      highlights: [
        "Full vault dashboard with AES-GCM encryption",
        "Promotion leads with nurture sequences",
        "Safety scanner + CI integration gate",
      ],
      safetyReport,
    },
    {
      dryRun: !execute,
      webhookUrl: process.env.PROMOTION_WEBHOOK_URL,
      repoRoot,
      netlifyHookUrl: process.env.NETLIFY_BUILD_HOOK,
    },
  );

  console.log(result.reason);
  if (result.plan) {
    console.log("\n--- Promotion plan ---");
    console.log(`Headline: ${result.plan.headline}`);
    console.log(`Channels: ${result.plan.channels.join(", ")}`);
    console.log("\n" + result.plan.body);
  }

  process.exit(result.approved ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
