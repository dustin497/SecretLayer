import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertProjectAllowed, buildBillingPlanResponse } from "./plan.js";
import type { User } from "../store.js";

const freeUser: User = {
  id: "u1",
  email: "a@test.com",
  password: "x",
  plan: "free",
};

describe("billing plan", () => {
  it("returns production-shaped plan response", () => {
    const res = buildBillingPlanResponse(freeUser);
    assert.equal(res.plan, "FREE");
    assert.equal(res.hasStripeCustomer, false);
    assert.equal(res.limits.secrets, 10);
  });

  it("blocks projects at free limit", () => {
    const err = assertProjectAllowed({ ...freeUser, plan: "free" });
    assert.equal(err, null);
  });
});
