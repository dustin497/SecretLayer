import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { runPromotionGate } from "@secretlayer/promotion";
import { fetchHeaders, runSafetySuite } from "@secretlayer/safety-engine";
import type { BillingPlanResponse, WaitlistLead } from "@secretlayer/shared";
import {
  applyStripeEvent,
  billingConfigured,
  createCheckoutSession,
  createPortalSession,
  isCheckoutPlanId,
  limitsForPlan,
  verifyWebhookSignature,
  type BillingUser,
} from "./billing/index.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const appVersion = process.env.APP_VERSION ?? "0.2.0";

app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  }),
);

app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    try {
      const signature = req.headers["stripe-signature"];
      const event = verifyWebhookSignature(req.body as Buffer, typeof signature === "string" ? signature : undefined);
      applyStripeEvent(event, billingStore);
      res.json({ received: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes("signature") ? 400 : 500;
      res.status(status).json({ error: message });
    }
  },
);

app.use(express.json({ limit: "256kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

interface UserRecord extends BillingUser {
  password: string;
}

// In-memory store for local dev (replace with DB in production)
const users = new Map<string, UserRecord>();
const sessions = new Map<string, string>();
const projects = new Map<string, { id: string; userId: string; name: string }>();
const waitlistLeads = new Map<string, WaitlistLead>();

const billingStore = {
  getUserById(userId: string) {
    return users.get(userId);
  },
  getUserByStripeCustomerId(customerId: string) {
    return [...users.values()].find((user) => user.stripeCustomerId === customerId);
  },
};

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const userId = req.headers["x-user-id"] as string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const uid = sessions.get(token);
    if (!uid) return res.status(401).json({ error: "Authentication required." });
    (req as express.Request & { userId: string }).userId = uid;
    return next();
  }

  if (userId) {
    (req as express.Request & { userId: string }).userId = userId;
    return next();
  }

  return res.status(401).json({ error: "Authentication required." });
}

function createUserRecord(id: string, email: string, password: string): UserRecord {
  return {
    id,
    email,
    password,
    plan: "FREE",
    subscriptionStatus: null,
    currentPeriodEnd: null,
  };
}

function billingPlanResponse(user: UserRecord): BillingPlanResponse {
  const projectCount = [...projects.values()].filter((project) => project.userId === user.id).length;
  return {
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    hasStripeCustomer: Boolean(user.stripeCustomerId),
    limits: limitsForPlan(user.plan),
    usage: { secrets: 0, projects: projectCount },
  };
}

async function buildSafetyReport(target = "https://secretlayer.net") {
  const headers = await fetchHeaders(target).catch(() => ({}));
  return runSafetySuite({
    targetUrl: target,
    responseHeaders: headers,
    config: {
      jwtSecretSet: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET !== "change-me-in-production"),
      encryptionEnabled: true,
      rateLimitEnabled: true,
      auditLogEnabled: waitlistLeads.size > 0,
    },
  });
}

const DEFAULT_HIGHLIGHTS = [
  "Industry-calibrated safety nets before every promotion",
  "Vault-first projects for the common builder",
  "Channel-ready promotion leads after safety clears",
];

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "secretlayer-backend",
    version: appVersion,
    waitlistCount: waitlistLeads.size,
    billingConfigured: billingConfigured(),
  });
});

app.get("/safety/report", publicLimiter, async (req, res) => {
  const target = (req.query.target as string) ?? "https://secretlayer.net";
  try {
    const report = await buildSafetyReport(target);
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: "Safety scan failed.", detail: String(err) });
  }
});

app.post("/promotion/check", publicLimiter, async (req, res) => {
  const target = req.body?.target ?? "https://secretlayer.net";
  const version = req.body?.version ?? appVersion;
  const highlights = req.body?.highlights ?? DEFAULT_HIGHLIGHTS;

  try {
    const safetyReport = await buildSafetyReport(target);
    const result = await runPromotionGate(
      { version, highlights, safetyReport },
      { dryRun: true, webhookUrl: process.env.PROMOTION_WEBHOOK_URL },
    );
    res.json({ result, safetyReport });
  } catch (err) {
    res.status(500).json({ error: "Promotion check failed.", detail: String(err) });
  }
});

app.post("/leads/waitlist", publicLimiter, (req, res) => {
  const { email, source } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required." });
  }

  const normalized = email.trim().toLowerCase();
  const existing = [...waitlistLeads.values()].find((lead) => lead.email === normalized);
  if (existing) {
    return res.json({ lead: existing, message: "Already on the waitlist." });
  }

  const lead: WaitlistLead = {
    id: crypto.randomUUID(),
    email: normalized,
    source: typeof source === "string" ? source : "web",
    createdAt: new Date().toISOString(),
  };
  waitlistLeads.set(lead.id, lead);

  res.status(201).json({
    lead,
    message: "You're on the waitlist — we'll notify you when the upgraded vault ships.",
    waitlistCount: waitlistLeads.size,
  });
});

app.get("/leads/waitlist/count", publicLimiter, (_req, res) => {
  res.json({ count: waitlistLeads.size });
});

app.post("/auth/signup", authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required." });

  const existing = [...users.values()].find((user) => user.email === email);
  if (existing) return res.status(409).json({ error: "Account already exists." });

  const id = crypto.randomUUID();
  users.set(id, createUserRecord(id, email, password));
  const token = crypto.randomUUID();
  sessions.set(token, id);

  res.json({ user: { id, email }, token });
});

app.post("/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = [...users.values()].find((record) => record.email === email && record.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials." });

  const token = crypto.randomUUID();
  sessions.set(token, user.id);
  res.json({ user: { id: user.id, email: user.email }, token });
});

app.post("/auth/logout", auth, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

app.get("/projects", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const list = [...projects.values()].filter((project) => project.userId === userId);
  res.json({ projects: list });
});

app.post("/projects", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const userProjects = [...projects.values()].filter((project) => project.userId === userId);
  const projectLimit = limitsForPlan(user.plan).projects;
  if (userProjects.length >= projectLimit) {
    return res.status(403).json({ error: "Project limit reached for your plan." });
  }

  const { name } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Project name required." });

  const project = { id: crypto.randomUUID(), userId, name };
  projects.set(project.id, project);
  res.status(201).json({ project });
});

app.get("/billing/plan", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json(billingPlanResponse(user));
});

app.post("/billing/checkout", auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const plan = req.body?.plan;
  if (!isCheckoutPlanId(plan)) {
    return res.status(400).json({ error: 'Plan must be "personal" or "pro".' });
  }

  if (!billingConfigured()) {
    return res.status(503).json({
      error: "Billing is not configured.",
      detail: "Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PERSONAL, and STRIPE_PRICE_ID_PRO on the API server (Railway).",
    });
  }

  try {
    const url = await createCheckoutSession(user, plan, webOrigin);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: "Could not start Stripe Checkout.", detail: String(err) });
  }
});

app.post("/billing/portal", auth, async (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  if (!user.stripeCustomerId) {
    return res.status(400).json({ error: "No Stripe customer on file. Upgrade first." });
  }

  if (!billingConfigured()) {
    return res.status(503).json({ error: "Billing is not configured." });
  }

  try {
    const url = await createPortalSession(user, webOrigin);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: "Billing portal failed.", detail: String(err) });
  }
});

app.get("/vault-items", auth, (_req, res) => {
  res.json({ vaultItems: [] });
});

app.listen(port, () => {
  console.log(`SecretLayer API listening on http://localhost:${port}`);
  if (!billingConfigured()) {
    console.warn("Stripe billing is not fully configured — checkout and portal routes will return 503.");
  }
});
