import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isWithinLimit, limitsForPlan, normalizePlanId } from "./plans.js";

describe("plans", () => {
  it("normalizes plan ids", () => {
    assert.equal(normalizePlanId("PERSONAL"), "personal");
    assert.equal(normalizePlanId("unknown"), "free");
  });

  it("free limits are capped", () => {
    const limits = limitsForPlan("free");
    assert.equal(limits.secrets, 10);
    assert.equal(isWithinLimit(9, limits.secrets), true);
    assert.equal(isWithinLimit(10, limits.secrets), false);
  });

  it("paid plans are unlimited", () => {
    const limits = limitsForPlan("pro");
    assert.equal(limits.secrets, null);
    assert.equal(isWithinLimit(9999, limits.secrets), true);
  });
});
