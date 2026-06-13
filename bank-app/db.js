const { Pool } = require("pg");
const crypto = require("crypto");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    })
  : null;

const memory = {
  users: new Map(),
  accounts: new Map(),
  transactions: new Map(),
};

function generateAccountNumber() {
  return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

async function query(text, params = []) {
  if (pool) {
    const result = await pool.query(text, params);
    return result;
  }
  return null;
}

async function initDb() {
  if (!pool) {
    console.log("CloudBank: using in-memory store (set DATABASE_URL for Postgres)");
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('checking', 'savings')),
      account_number TEXT UNIQUE NOT NULL,
      balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out')),
      amount NUMERIC(14, 2) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      balance_after NUMERIC(14, 2) NOT NULL,
      related_account_id UUID REFERENCES accounts(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
  `);

  console.log("CloudBank: Postgres schema ready");
}

async function createUser({ email, passwordHash, fullName }) {
  const id = crypto.randomUUID();
  const normalized = email.trim().toLowerCase();

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userResult = await client.query(
        `INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, created_at`,
        [id, normalized, passwordHash, fullName],
      );
      const checkingId = crypto.randomUUID();
      const savingsId = crypto.randomUUID();
      await client.query(
        `INSERT INTO accounts (id, user_id, type, account_number, balance) VALUES
         ($1, $4, 'checking', $2, 1000.00),
         ($3, $4, 'savings', $5, 500.00)`,
        [checkingId, generateAccountNumber(), savingsId, id, generateAccountNumber()],
      );
      await client.query(
        `INSERT INTO transactions (id, account_id, type, amount, description, balance_after) VALUES
         ($1, $2, 'deposit', 1000.00, 'Welcome bonus — checking', 1000.00),
         ($3, $4, 'deposit', 500.00, 'Welcome bonus — savings', 500.00)`,
        [crypto.randomUUID(), checkingId, crypto.randomUUID(), savingsId],
      );
      await client.query("COMMIT");
      return userResult.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  if ([...memory.users.values()].some((u) => u.email === normalized)) {
    const err = new Error("duplicate");
    err.code = "23505";
    throw err;
  }

  const user = { id, email: normalized, password_hash: passwordHash, full_name: fullName, created_at: new Date().toISOString() };
  memory.users.set(id, user);

  for (const [type, balance, bonus] of [
    ["checking", 1000, "Welcome bonus — checking"],
    ["savings", 500, "Welcome bonus — savings"],
  ]) {
    const accountId = crypto.randomUUID();
    memory.accounts.set(accountId, {
      id: accountId,
      user_id: id,
      type,
      account_number: generateAccountNumber(),
      balance,
      created_at: new Date().toISOString(),
    });
    const txId = crypto.randomUUID();
    memory.transactions.set(txId, {
      id: txId,
      account_id: accountId,
      type: "deposit",
      amount: balance,
      description: bonus,
      balance_after: balance,
      related_account_id: null,
      created_at: new Date().toISOString(),
    });
  }

  return { id: user.id, email: user.email, full_name: user.full_name, created_at: user.created_at };
}

async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  if (pool) {
    const result = await query("SELECT * FROM users WHERE email = $1", [normalized]);
    return result.rows[0] ?? null;
  }
  return [...memory.users.values()].find((u) => u.email === normalized) ?? null;
}

async function findUserById(id) {
  if (pool) {
    const result = await query("SELECT id, email, full_name, created_at FROM users WHERE id = $1", [id]);
    return result.rows[0] ?? null;
  }
  const user = memory.users.get(id);
  if (!user) return null;
  return { id: user.id, email: user.email, full_name: user.full_name, created_at: user.created_at };
}

async function getAccountsForUser(userId) {
  if (pool) {
    const result = await query(
      "SELECT id, type, account_number, balance::float, created_at FROM accounts WHERE user_id = $1 ORDER BY type",
      [userId],
    );
    return result.rows;
  }
  return [...memory.accounts.values()]
    .filter((a) => a.user_id === userId)
    .map((a) => ({ ...a }))
    .sort((a, b) => a.type.localeCompare(b.type));
}

async function getAccountForUser(accountId, userId) {
  if (pool) {
    const result = await query(
      "SELECT id, type, account_number, balance::float, created_at FROM accounts WHERE id = $1 AND user_id = $2",
      [accountId, userId],
    );
    return result.rows[0] ?? null;
  }
  const account = memory.accounts.get(accountId);
  if (!account || account.user_id !== userId) return null;
  return { ...account };
}

async function getTransactionsForAccount(accountId, limit = 50) {
  if (pool) {
    const result = await query(
      `SELECT id, type, amount::float, description, balance_after::float, related_account_id, created_at
       FROM transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [accountId, limit],
    );
    return result.rows;
  }
  return [...memory.transactions.values()]
    .filter((t) => t.account_id === accountId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

async function applyTransaction({ accountId, type, amount, description, relatedAccountId = null }) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error("Invalid amount");
    err.status = 400;
    throw err;
  }

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const accountResult = await client.query("SELECT balance FROM accounts WHERE id = $1 FOR UPDATE", [accountId]);
      if (!accountResult.rows[0]) {
        const err = new Error("Account not found");
        err.status = 404;
        throw err;
      }
      let balance = Number(accountResult.rows[0].balance);
      if (type === "withdrawal" || type === "transfer_out") {
        if (balance < value) {
          const err = new Error("Insufficient funds");
          err.status = 400;
          throw err;
        }
        balance -= value;
      } else {
        balance += value;
      }
      await client.query("UPDATE accounts SET balance = $1 WHERE id = $2", [balance, accountId]);
      const txId = crypto.randomUUID();
      const txResult = await client.query(
        `INSERT INTO transactions (id, account_id, type, amount, description, balance_after, related_account_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, type, amount::float, description, balance_after::float, related_account_id, created_at`,
        [txId, accountId, type, value, description, balance, relatedAccountId],
      );
      await client.query("COMMIT");
      return txResult.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  const account = memory.accounts.get(accountId);
  if (!account) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }
  if (type === "withdrawal" || type === "transfer_out") {
    if (account.balance < value) {
      const err = new Error("Insufficient funds");
      err.status = 400;
      throw err;
    }
    account.balance -= value;
  } else {
    account.balance += value;
  }
  const tx = {
    id: crypto.randomUUID(),
    account_id: accountId,
    type,
    amount: value,
    description,
    balance_after: account.balance,
    related_account_id: relatedAccountId,
    created_at: new Date().toISOString(),
  };
  memory.transactions.set(tx.id, tx);
  return tx;
}

async function transferBetweenAccounts({ fromAccountId, toAccountId, amount, description }) {
  if (fromAccountId === toAccountId) {
    const err = new Error("Cannot transfer to the same account");
    err.status = 400;
    throw err;
  }

  if (pool) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const fromResult = await client.query("SELECT balance, user_id FROM accounts WHERE id = $1 FOR UPDATE", [fromAccountId]);
      const toResult = await client.query("SELECT balance, user_id FROM accounts WHERE id = $1 FOR UPDATE", [toAccountId]);
      if (!fromResult.rows[0] || !toResult.rows[0]) {
        const err = new Error("Account not found");
        err.status = 404;
        throw err;
      }
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        const err = new Error("Invalid amount");
        err.status = 400;
        throw err;
      }
      let fromBalance = Number(fromResult.rows[0].balance);
      if (fromBalance < value) {
        const err = new Error("Insufficient funds");
        err.status = 400;
        throw err;
      }
      let toBalance = Number(toResult.rows[0].balance);
      fromBalance -= value;
      toBalance += value;
      await client.query("UPDATE accounts SET balance = $1 WHERE id = $2", [fromBalance, fromAccountId]);
      await client.query("UPDATE accounts SET balance = $1 WHERE id = $2", [toBalance, toAccountId]);
      const outId = crypto.randomUUID();
      const inId = crypto.randomUUID();
      const outTx = await client.query(
        `INSERT INTO transactions (id, account_id, type, amount, description, balance_after, related_account_id)
         VALUES ($1, $2, 'transfer_out', $3, $4, $5, $6)
         RETURNING id, type, amount::float, description, balance_after::float, related_account_id, created_at`,
        [outId, fromAccountId, value, description || "Transfer out", fromBalance, toAccountId],
      );
      const inTx = await client.query(
        `INSERT INTO transactions (id, account_id, type, amount, description, balance_after, related_account_id)
         VALUES ($1, $2, 'transfer_in', $3, $4, $5, $6)
         RETURNING id, type, amount::float, description, balance_after::float, related_account_id, created_at`,
        [inId, toAccountId, value, description || "Transfer in", toBalance, fromAccountId],
      );
      await client.query("COMMIT");
      return { out: outTx.rows[0], in: inTx.rows[0] };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  const from = memory.accounts.get(fromAccountId);
  const to = memory.accounts.get(toAccountId);
  if (!from || !to) {
    const err = new Error("Account not found");
    err.status = 404;
    throw err;
  }
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    const err = new Error("Invalid amount");
    err.status = 400;
    throw err;
  }
  if (from.balance < value) {
    const err = new Error("Insufficient funds");
    err.status = 400;
    throw err;
  }
  from.balance -= value;
  to.balance += value;
  const outTx = {
    id: crypto.randomUUID(),
    account_id: fromAccountId,
    type: "transfer_out",
    amount: value,
    description: description || "Transfer out",
    balance_after: from.balance,
    related_account_id: toAccountId,
    created_at: new Date().toISOString(),
  };
  const inTx = {
    id: crypto.randomUUID(),
    account_id: toAccountId,
    type: "transfer_in",
    amount: value,
    description: description || "Transfer in",
    balance_after: to.balance,
    related_account_id: fromAccountId,
    created_at: new Date().toISOString(),
  };
  memory.transactions.set(outTx.id, outTx);
  memory.transactions.set(inTx.id, inTx);
  return { out: outTx, in: inTx };
}

async function getDashboardSummary(userId) {
  const accounts = await getAccountsForUser(userId);
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const recent = [];
  for (const account of accounts) {
    const txs = await getTransactionsForAccount(account.id, 5);
    for (const tx of txs) {
      recent.push({ ...tx, account_type: account.type, account_number: account.account_number });
    }
  }
  recent.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { accounts, totalBalance, recentTransactions: recent.slice(0, 10) };
}

module.exports = {
  initDb,
  createUser,
  findUserByEmail,
  findUserById,
  getAccountsForUser,
  getAccountForUser,
  getTransactionsForAccount,
  applyTransaction,
  transferBetweenAccounts,
  getDashboardSummary,
  usingPostgres: Boolean(pool),
};
