# SecretLayer

**[secretlayer.net](https://secretlayer.net)** — vault-first secrets for builders. Organize projects into encrypted vaults, run industry-calibrated safety nets, and promote only after checks pass — with channel-ready promotion leads.

> Canonical repo: [github.com/dustin497/SecretLayer](https://github.com/dustin497/SecretLayer)

## Stack

| Package | Purpose |
|---------|---------|
| `apps/web` | React + Vite frontend (safety scan, promotion preview, waitlist) |
| `apps/api` | Express API (auth, projects, safety, promotion, leads) |
| `packages/safety-engine` | Pre-ship safety scans |
| `packages/promotion` | Promotion gate + channel-specific leads |
| `packages/shared` | Shared types |

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev          # web :5173 + api :8787
```

## Commands

```bash
pnpm build        # build all packages
pnpm test         # run tests
pnpm safety:run   # scan secretlayer.net (+ optional source dir)
pnpm promote:check # safety → promotion plan + channel leads
```

## Integration flow

```
Safety scan → score ≥ 80, zero critical blockers
     ↓
Promotion gate → changelog, site, social, email leads
     ↓
Waitlist + webhook → notify builders when vault ships
```

API endpoints (local dev):

- `GET /safety/report` — production safety scan
- `POST /promotion/check` — gate + promotion leads preview
- `POST /leads/waitlist` — capture builder waitlist leads

## Live product

Production runs on **Netlify** (web) and **Railway** (`api.secretlayer.net`). This repo rebuilds and extends that MVP with:

- Safety engine + promotion gate in CI
- Channel-ready promotion leads (changelog, social, email, deploy)
- Clear vault → project data model
- Path to CLI, GitHub Actions, and automated marketing

See [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) and [docs/SAFETY_NETS.md](docs/SAFETY_NETS.md).

## Environment

Copy `.env.example` to `.env`. Key variables:

- `JWT_SECRET` — API auth (required in production)
- `PROMOTION_WEBHOOK_URL` — optional webhook when promotion gate passes
- `APP_VERSION` — version string for promotion leads (default `0.2.0`)
