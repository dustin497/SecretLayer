import { Router, type NextFunction, type Request, type Response } from "express";
import { normalizePlanId, type PlanId } from "@secretlayer/shared";
import { audit, getUser } from "../store.js";
import { buildBillingPlanResponse } from "./plan.js";
import { createCheckoutSession, createPortalSession, stripeConfigured } from "./stripe.js";
import { handleStripeWebhook } from "./webhook.js";

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type AuthedRequest = Request & { userId: string };

export async function stripeWebhookHandler(req: Request, res: Response) {
  try {
    const raw = req.body as Buffer;
    await handleStripeWebhook(raw, req.headers["stripe-signature"] as string | undefined);
    res.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    res.status(400).json({ error: message });
  }
}

export function createBillingRouter(auth: AuthMiddleware, webOrigin: string) {
  const router = Router();

  router.get("/plan", auth, (req, res) => {
    const user = getUser((req as AuthedRequest).userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(buildBillingPlanResponse(user));
  });

  router.post("/checkout", auth, async (req, res) => {
    if (!stripeConfigured()) {
      return res.status(503).json({ error: "Billing is not configured. Set STRIPE_SECRET_KEY and price IDs." });
    }
    const user = getUser((req as AuthedRequest).userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const plan = normalizePlanId(req.body?.plan) as PlanId;
    if (plan === "free") return res.status(400).json({ error: "Cannot checkout free plan." });

    try {
      const url = await createCheckoutSession(user, plan, webOrigin);
      audit("billing.checkout.start", plan, user.id);
      res.json({ url });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      res.status(500).json({ error: message });
    }
  });

  router.post("/portal", auth, async (req, res) => {
    if (!stripeConfigured()) {
      return res.status(503).json({ error: "Billing is not configured." });
    }
    const user = getUser((req as AuthedRequest).userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: "No billing account yet. Upgrade first." });
    }

    try {
      const url = await createPortalSession(user, webOrigin);
      audit("billing.portal.open", user.plan, user.id);
      res.json({ url });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Portal failed";
      res.status(500).json({ error: message });
    }
  });

  return router;
}
