import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import type { PromotionLead } from "@secretlayer/shared";
import { createBillingRouter, stripeWebhookHandler } from "./billing/router.js";
import { resolveStripeSecretKey } from "./billing/keys.js";
import { assertProjectAllowed, assertSecretAllowed } from "./billing/plan.js";
import { applyReferralOnSignup, generateReferralCode, getReferralStats } from "./referrals.js";
import { audit, auditLog, getUser, leads, projects, sessions, users, vaultItems } from "./store.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const adminKey = process.env.ADMIN_API_KEY;

app.use(cors({ origin: [webOrigin, "https://secretlayer.net"], credentials: true }));

app.post("/billing/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(express.json({ limit: "512kb" }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true });
const leadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true });

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

app.use("/billing", createBillingRouter(auth, webOrigin));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "secretlayer-backend",
    version: "0.3.0",
    stripe: Boolean(resolveStripeSecretKey()),
  });
});

app.post("/auth/signup", authLimiter, (req, res) => {
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

app.post("/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = [...users.values()].find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials." });
  const token = crypto.randomUUID();
  sessions.set(token, user.id);
  audit("auth.login", email, user.id);
  res.json({ user: { id: user.id, email: user.email }, token });
});

app.post("/auth/logout", auth, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) sessions.delete(token);
  audit("auth.logout", "session ended", (req as express.Request & { userId: string }).userId);
  res.json({ ok: true });
});

app.get("/projects", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const list = [...projects.values()].filter((p) => p.userId === userId);
  res.json({ projects: list });
});

app.post("/projects", auth, (req, res) => {
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

app.get("/vault-items", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const items = [...vaultItems.values()].filter((v) => v.userId === userId);
  res.json({ vaultItems: items });
});

app.put("/vault-items/client/:clientId", auth, (req, res) => {
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

app.delete("/vault-items/client/:clientId", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const clientId = String(req.params.clientId);
  const item = vaultItems.get(clientId);
  if (!item || item.userId !== userId) return res.status(404).json({ error: "Not found." });
  vaultItems.delete(clientId);
  audit("vault.delete", clientId, userId);
  res.json({ ok: true });
});

app.post("/leads", leadLimiter, (req, res) => {
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

app.get("/leads/summary", adminAuth, (_req, res) => {
  res.json({ leads: [...leads.values()], total: leads.size });
});

app.post("/analytics/events", (req, res) => {
  const { event, properties } = req.body ?? {};
  if (!event) return res.status(400).json({ error: "Event name required." });
  audit("analytics", `${event} ${JSON.stringify(properties ?? {})}`);
  res.json({ ok: true });
});

app.get("/referrals/me", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const stats = getReferralStats(userId);
  if (!stats) return res.status(404).json({ error: "User not found." });
  res.json(stats);
});

app.get("/safety/status", (_req, res) => {
  res.json({
    target: "https://secretlayer.net",
    lastChecked: process.env.SAFETY_LAST_CHECK ?? null,
    score: process.env.SAFETY_SCORE ? Number(process.env.SAFETY_SCORE) : null,
    passed: process.env.SAFETY_PASSED === "true",
  });
});

app.get("/audit", adminAuth, (_req, res) => {
  res.json({ entries: auditLog.slice(-100) });
});

app.listen(port, () => {
  console.log(`SecretLayer API listening on http://localhost:${port}`);
});
