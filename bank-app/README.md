# CloudBank

A demo cloud banking application with checking & savings accounts, deposits, withdrawals, transfers, and transaction history.

**This is a demonstration app — not a licensed financial institution.** Do not use it for real money or regulated banking.

## Features

- User registration and sign-in
- Checking and savings accounts (with welcome balances on signup)
- Deposits, withdrawals, and internal transfers
- Transaction history and dashboard
- PostgreSQL persistence in production (in-memory store for local dev)

## Local development

```bash
cd bank-app
npm install
npm run dev
```

Open http://localhost:3000

Optional: set `DATABASE_URL` to a Postgres connection string for persistent storage.

## Deploy to Render

The repo includes a Render Blueprint in the root `render.yaml`. After pushing this branch:

1. Open [Render Blueprint deploy](https://dashboard.render.com/blueprint/new?repo=https://github.com/dustin497/SecretLair-)
2. Review the **cloudbank** web service and **cloudbank-db** Postgres database
3. Click **Apply** to deploy

Your bank will be live at `https://cloudbank.onrender.com` (or similar).

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Sign in |
| `/api/dashboard` | GET | Balances + recent transactions |
| `/api/accounts/:id/deposit` | POST | Deposit funds |
| `/api/accounts/:id/withdraw` | POST | Withdraw funds |
| `/api/transfers` | POST | Transfer between your accounts |
