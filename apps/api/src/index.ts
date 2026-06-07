import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { FREE_PLAN_LIMITS } from "@secretlayer/shared";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "256kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// In-memory store for local dev (replace with DB in production)
const users = new Map<string, { id: string; email: string; password: string }>();
const sessions = new Map<string, string>();
const projects = new Map<string, { id: string; userId: string; name: string }>();

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

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "secretlayer-backend" });
});

app.post("/auth/signup", authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required." });

  const existing = [...users.values()].find((u) => u.email === email);
  if (existing) return res.status(409).json({ error: "Account already exists." });

  const id = crypto.randomUUID();
  users.set(id, { id, email, password });
  const token = crypto.randomUUID();
  sessions.set(token, id);

  res.json({ user: { id, email }, token });
});

app.post("/auth/login", authLimiter, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = [...users.values()].find((u) => u.email === email && u.password === password);
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
  const list = [...projects.values()].filter((p) => p.userId === userId);
  res.json({ projects: list });
});

app.post("/projects", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const userProjects = [...projects.values()].filter((p) => p.userId === userId);
  if (userProjects.length >= FREE_PLAN_LIMITS.projects) {
    return res.status(403).json({ error: "Project limit reached for free plan." });
  }

  const { name } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Project name required." });

  const project = { id: crypto.randomUUID(), userId, name };
  projects.set(project.id, project);
  res.status(201).json({ project });
});

app.get("/billing/plan", auth, (req, res) => {
  const userId = (req as express.Request & { userId: string }).userId;
  const projectCount = [...projects.values()].filter((p) => p.userId === userId).length;
  res.json({
    plan: "free",
    limits: FREE_PLAN_LIMITS,
    usage: { secrets: 0, projects: projectCount },
  });
});

app.get("/vault-items", auth, (_req, res) => {
  res.json({ vaultItems: [] });
});

app.listen(port, () => {
  console.log(`SecretLayer API listening on http://localhost:${port}`);
});
