const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const db = require("./db");
const { hashPassword, verifyPassword, createSession, destroySession, authMiddleware } = require("./auth");

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, "public");

app.use(cors());
app.use(express.json({ limit: "64kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "cloudbank",
    storage: db.usingPostgres ? "postgres" : "memory",
  });
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { email, password, fullName } = req.body ?? {};
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: "Email, password, and full name are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const user = await db.createUser({
      email,
      passwordHash: hashPassword(password),
      fullName: fullName.trim(),
    });
    const token = createSession(user.id);
    res.status(201).json({
      user: { id: user.id, email: user.email, fullName: user.full_name },
      token,
      message: "Welcome to CloudBank! Your checking and savings accounts are ready with starter balances.",
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await db.findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = createSession(user.id);
  res.json({
    user: { id: user.id, email: user.email, fullName: user.full_name },
    token,
  });
});

app.post("/api/auth/logout", authMiddleware, (req, res) => {
  destroySession(req.token);
  res.json({ ok: true });
});

app.get("/api/me", authMiddleware, async (req, res) => {
  const user = await db.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: { id: user.id, email: user.email, fullName: user.full_name } });
});

app.get("/api/dashboard", authMiddleware, apiLimiter, async (req, res) => {
  try {
    const summary = await db.getDashboardSummary(req.userId);
    res.json(summary);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Failed to load dashboard." });
  }
});

app.get("/api/accounts", authMiddleware, apiLimiter, async (req, res) => {
  const accounts = await db.getAccountsForUser(req.userId);
  res.json({ accounts });
});

app.get("/api/accounts/:id/transactions", authMiddleware, apiLimiter, async (req, res) => {
  const account = await db.getAccountForUser(req.params.id, req.userId);
  if (!account) return res.status(404).json({ error: "Account not found." });
  const transactions = await db.getTransactionsForAccount(account.id);
  res.json({ account, transactions });
});

app.post("/api/accounts/:id/deposit", authMiddleware, apiLimiter, async (req, res) => {
  const { amount, description } = req.body ?? {};
  const account = await db.getAccountForUser(req.params.id, req.userId);
  if (!account) return res.status(404).json({ error: "Account not found." });

  try {
    const transaction = await db.applyTransaction({
      accountId: account.id,
      type: "deposit",
      amount,
      description: description?.trim() || "Deposit",
    });
    const updated = await db.getAccountForUser(account.id, req.userId);
    res.status(201).json({ transaction, account: updated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Deposit failed." });
  }
});

app.post("/api/accounts/:id/withdraw", authMiddleware, apiLimiter, async (req, res) => {
  const { amount, description } = req.body ?? {};
  const account = await db.getAccountForUser(req.params.id, req.userId);
  if (!account) return res.status(404).json({ error: "Account not found." });

  try {
    const transaction = await db.applyTransaction({
      accountId: account.id,
      type: "withdrawal",
      amount,
      description: description?.trim() || "Withdrawal",
    });
    const updated = await db.getAccountForUser(account.id, req.userId);
    res.status(201).json({ transaction, account: updated });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Withdrawal failed." });
  }
});

app.post("/api/transfers", authMiddleware, apiLimiter, async (req, res) => {
  const { fromAccountId, toAccountId, amount, description } = req.body ?? {};
  if (!fromAccountId || !toAccountId || !amount) {
    return res.status(400).json({ error: "fromAccountId, toAccountId, and amount are required." });
  }

  const from = await db.getAccountForUser(fromAccountId, req.userId);
  const to = await db.getAccountForUser(toAccountId, req.userId);
  if (!from || !to) {
    return res.status(404).json({ error: "One or both accounts not found." });
  }

  try {
    const result = await db.transferBetweenAccounts({
      fromAccountId: from.id,
      toAccountId: to.id,
      amount,
      description: description?.trim() || `Transfer: ${from.type} → ${to.type}`,
    });
    const updatedFrom = await db.getAccountForUser(from.id, req.userId);
    const updatedTo = await db.getAccountForUser(to.id, req.userId);
    res.status(201).json({ transfer: result, from: updatedFrom, to: updatedTo });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Transfer failed." });
  }
});

app.use(express.static(publicDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

async function start() {
  await db.initDb();
  app.listen(port, "0.0.0.0", () => {
    console.log(`CloudBank running on http://0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start CloudBank:", err);
  process.exit(1);
});
