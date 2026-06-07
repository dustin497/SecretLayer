import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import type { BillingUser } from "./stripe.js";
import { applyStripeEvent } from "./webhook.js";

function makeUser(overrides: Partial<BillingUser> = {}): BillingUser {
  return {
    id: "user-1",
    email: "builder@example.com",
    plan: "FREE",
    subscriptionStatus: null,
    currentPeriodEnd: null,
    ...overrides,
  };
}

test("checkout.session.completed upgrades user plan", () => {
  const user = makeUser();
  const store = {
    getUserById: () => user,
    getUserByStripeCustomerId: () => undefined,
  };

  applyStripeEvent(
    {
      type: "checkout.session.completed",
      data: {
        object: {
          customer: "cus_123",
          metadata: { userId: "user-1", plan: "PRO" },
        },
      },
    } as unknown as Stripe.Event,
    store,
  );

  assert.equal(user.stripeCustomerId, "cus_123");
  assert.equal(user.plan, "PRO");
  assert.equal(user.subscriptionStatus, "active");
});

test("customer.subscription.deleted downgrades user to free", () => {
  const user = makeUser({
    stripeCustomerId: "cus_123",
    plan: "PERSONAL",
    subscriptionStatus: "active",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
  });
  const store = {
    getUserById: () => undefined,
    getUserByStripeCustomerId: () => user,
  };

  applyStripeEvent(
    {
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_123" } },
    } as unknown as Stripe.Event,
    store,
  );

  assert.equal(user.plan, "FREE");
  assert.equal(user.subscriptionStatus, "canceled");
  assert.equal(user.currentPeriodEnd, null);
});
