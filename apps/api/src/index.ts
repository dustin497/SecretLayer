import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { runPromotionGate } from "@secretlayer/promotion";
import { fetchHeaders, runSafetySuite } from "@secretlayer/safety-engine";
import type { PromotionLead, WaitlistLead, Wwh2Feedback, Wwh2Stats } from "@secretlayer/shared";
import { createBillingRouter, stripeWebhookHandler } from "./billing/router.js";
import { resolveStripeSecretKey } from "./billing/keys.js";
import { assertProjectAllowed, assertSecretAllowed } from "./billing/plan.js";
import { applyReferralOnSignup, generateReferralCode, getReferralStats } from "./referrals.js";
import { audit, auditLog, getUser, leads, projects, sessions, users, vaultItems } from "./store.js";
import { createWwh2Store, type Wwh2FeedbackStore } from "./wwh2-store.js";
import { mountWebApp } from "./static.js";

const app = express();
const api = express.Router();
const port = Number(process.env.PORT ?? 8787);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const appVersion = process.env.APP_VERSION ?? "0.3.1";
const adminKey = process.env.ADMIN_API_KEY;

const allowedOrigins = new Set([
  webOrigin,
  "https://secretlayer.net",
  "https://www.secretlayer.net",
  "http://localhost:5173",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true,
  }),
);

app.post("/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "512kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const waitlistLeads = new Map<string, WaitlistLead>();
let wwh2Store: Wwh2FeedbackStore;

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

function adminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!adminKey || req.headers["x-admin-key"] !== adminKey) {
    return res.status(403).json({ error: "Admin key required." });
  }
  next();
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
      auditLogEnabled: waitlistLeads.size > 0 || auditLog.length > 0,
    },
  });
}

async function computeWwh2Stats(): Promise<Wwh2Stats> {
  const entries = await wwh2Store.getAll();
  const totalSessions = entries.length;
  const averageRating =
    totalSessions === 0 ? 0 : entries.reduce((sum, e) => sum + e.rating, 0) / totalSessions;
  const helpfulCount = entries.filter((e) => e.helpful).length;
  const helpfulPercent = totalSessions === 0 ? 0 : Math.round((helpfulCount / totalSessions) * 100);
  const playbookCounts: Record<string, number> = {};
  for (const entry of entries) {
    playbookCounts[entry.playbookId] = (playbookCounts[entry.playbookId] ?? 0) + 1;
  }
  return { totalSessions, averageRating, helpfulPercent, playbookCounts };
}

const DEFAULT_HIGHLIGHTS = [
  "Industry-calibrated safety nets before every promotion",
  "Vault-first projects for the common builder",
  "Channel-ready promotion leads after safety clears",
  "WWH2 guided help — free for all users",
];

api.use("/billing", createBillingRouter(auth, webOrigin));

api.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "secretlayer-backend",
    version: appVersion,
    stripe: Boolean(resolveStripeSecretKey()),
    waitlistCount: waitlistLeads.size,
    wwh2Sessions: wwh2Store ? await wwh2Store.count() : 0,
    wwh2Store: process.env.DATABASE_URL ? "postgres" : "file",
  });
});

api.get("/wwh2/stats", publicLimiter, async (_req, res) => {
  res.json({ stats: await computeWwh2Stats() });
});

api.post("/wwh2/feedback", publicLimiter, async (req, res) => {
  const { playbookId, playbookTitle, rating, helpful, comment, completedSteps, totalSteps } = req.body ?? {};

  if (!playbookId || typeof playbookId !== "string") {
    return res.status(400).json({ error: "playbookId required." });
  }
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be 1–5." });
  }
  if (typeof helpful !== "boolean") {
    return res.status(400).json({ error: "helpful must be true or false." });
  }

  const entry: Wwh2Feedback = {
    id: crypto.randomUUID(),
    playbookId,
    playbookTitle: typeof playbookTitle === "string" ? playbookTitle : playbookId,
    rating,
    helpful,
    comment: typeof comment === "string" && comment.trim() ? comment.trim().slice(0, 2000) : undefined,
    completedSteps: typeof completedSteps === "number" ? completedSteps : 0,
    totalSteps: typeof totalSteps === "number" ? totalSteps : 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await wwh2Store.add(entry);
    res.status(201).json({
      feedback: entry,
      stats: await computeWwh2Stats(),
      message: "Thanks — your WWH2 rating helps other developers find guided help faster.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to save feedback.", detail: String(err) });
  }
});

api.get("/safety/report", publicLimiter, async (req, res) => {
  const target = (req.query.target as string) ?? "https://secretlayer.net";
  try {
    const report = await buildSafetyReport(target);
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: "Safety scan failed.", detail: String(err) });
  }
});

api.post("/promotion/check", publicLimiter, async (req, res) => {
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

api.post("/leads/waitlist", publicLimiter, (req, res) => {
  const { email, source } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required." });
  }

  const normalized = email.trim().toLowerCase();
  const existing = [...waitlistLeads.values()].find((l) => l.email === normalized);
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

api.get("/leads/waitlist/count", publicLimiter, (_req, res) => {
  res.json({ count: waitlistLeads.size });
});

api.post("/auth/signup", authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required." });
  if ([...users.values()].some((u) => u.email === email)) {
    return res.status(409).json({ error: "Account already exists." });
  }
  const id = crypto.randomUUID();
  const referralCode = generateReferralCode(id);
  users.set(id, {
    id,
    email,
    password,
    plan: "free",
    subscriptionStatus: null,
    currentPeriodEnd: null,
    referralCode,
    referralCount: 0,
  });
  applyReferralOnSignup(id, req.body?.referralCode);
  const token = crypto.randomUUID();
  sessions.set(token, id);
  audit("auth.signup", email, id);
  res.json({ user: { id, email }, token, referralCode });
});

api.post("/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = [...users.values()].find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials." });
  const token = crypto.randomUUID();
  sessions.set(token, user.id);
  audit("auth.login", email, user.id);
  res.json({ user: { id: user.id, email: user.email }, token });
});

api.post("/auth/logout", auth, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) sessions.delete(token);
  audit("auth.logout", "session ended", (req as express.Request & { userId: string }).userId);
  res.json({ ok: true });
});

api.get("/projects", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const list = [...projects.values()].filter((p) => p.userId === userId);
  res.json({ projects: list });
});

api.post("/projects", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = getUser(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const limitError = assertProjectAllowed(user);
  if (limitError) return res.status(403).json({ error: limitError });

  const { name, description } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Project name required." });
  const project = {
    id: crypto.randomUUID(),
    userId,
    name,
    description,
    createdAt: new Date().toISOString(),
  };
  projects.set(project.id, project);
  audit("project.create", name, userId);
  res.status(201).json({ project });
});

api.get("/vault-items", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const items = [...vaultItems.values()].filter((v) => v.userId === userId);
  res.json({ vaultItems: items });
});

api.put("/vault-items/client/:clientId", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const user = getUser(userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  const clientId = String(req.params.clientId);
  const { label, encryptedBlob, encryptionMeta, updatedAt } = req.body ?? {};

  if (!encryptedBlob || !encryptionMeta?.clientEncrypted) {
    return res.status(400).json({ error: "Encrypted blob required." });
  }

  const existing = vaultItems.get(clientId);
  const limitError = assertSecretAllowed(user, !existing);
  if (limitError) return res.status(403).json({ error: limitError });

  if (existing && existing.userId !== userId) {
    return res.status(409).json({ error: "Client ID conflict." });
  }

  vaultItems.set(clientId, {
    clientId,
    userId,
    label: label ?? "Encrypted vault item",
    encryptedBlob,
    encryptionMeta,
    updatedAt: updatedAt ?? new Date().toISOString(),
  });
  audit("vault.sync", `clientId=${clientId}`, userId);
  res.json({ ok: true, clientId });
});

api.delete("/vault-items/client/:clientId", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const clientId = String(req.params.clientId);
  const item = vaultItems.get(clientId);
  if (!item || item.userId !== userId) return res.status(404).json({ error: "Not found." });
  vaultItems.delete(clientId);
  audit("vault.delete", clientId, userId);
  res.json({ ok: true });
});

api.post("/leads", leadLimiter, (req, res) => {
  const { email, source, intent, message } = req.body ?? {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required." });
  }
  const lead: PromotionLead = {
    id: crypto.randomUUID(),
    email: email.toLowerCase().trim(),
    source: source ?? "landing",
    intent: intent ?? "early-access",
    message,
    createdAt: new Date().toISOString(),
  };
  leads.set(lead.id, lead);
  audit("lead.capture", `${lead.email} (${lead.source})`);
  res.status(201).json({ lead: { id: lead.id, email: lead.email } });
});

api.get("/leads/summary", adminAuth, (_req, res) => {
  res.json({ leads: [...leads.values()], total: leads.size });
});

api.post("/analytics/events", publicLimiter, (req, res) => {
  const { event, properties } = req.body ?? {};
  if (!event) return res.status(400).json({ error: "Event name required." });
  audit("analytics", `${event} ${JSON.stringify(properties ?? {})}`);
  res.json({ ok: true });
});

api.get("/referrals/me", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const stats = getReferralStats(userId);
  if (!stats) return res.status(404).json({ error: "User not found." });
  res.json(stats);
});

api.get("/safety/status", publicLimiter, (_req, res) => {
  res.json({
    target: "https://secretlayer.net",
    lastChecked: process.env.SAFETY_LAST_CHECK ?? null,
    score: process.env.SAFETY_SCORE ? Number(process.env.SAFETY_SCORE) : null,
    passed: process.env.SAFETY_PASSED === "true",
  });
});

api.get("/audit", adminAuth, (_req, res) => {
  res.json({ entries: auditLog.slice(-100) });
});

app.use("/api", api);
app.use(api);

wwh2Store = await createWwh2Store();
await wwh2Store.load();

const servingWeb = mountWebApp(app);

app.listen(port, () => {
  console.log(`SecretLayer API listening on http://localhost:${port}${servingWeb ? " (web + api)" : ""}`);
});
