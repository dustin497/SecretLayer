import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPromotionLeads } from "./leads.js";

describe("buildPromotionLeads", () => {
  it("generates channel-specific promotion leads", () => {
    const leads = buildPromotionLeads({
      version: "0.2.0",
      highlights: ["Safety engine", "Vault UX"],
      safetyScore: 92,
    });

    assert.equal(leads.length, 5);
    assert.ok(leads.some((l) => l.channel === "changelog" && l.content.includes("0.2.0")));
    assert.ok(leads.some((l) => l.channel === "social-announcement" && l.content.includes("92/100")));
    assert.ok(leads.some((l) => l.channel === "email-waitlist" && l.content.includes("Subject:")));
    assert.ok(leads.every((l) => l.title && l.content && l.cta));
  });
});
