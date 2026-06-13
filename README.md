# SecretLayer

**[secretlayer.net](https://secretlayer.net)** — vault-first secrets for builders. Projects, encrypted vaults, safety nets, and promotion gates that only fire after checks pass.

## Stack

| Package | Purpose |
|---------|---------|
| `apps/web` | React app — landing, auth, vault dashboard, safety scanner, WWH2 guided help |
| `apps/api` | Express API — auth, projects, vault-items, billing, leads, analytics, WWH2 |
| `packages/crypto` | AES-GCM + PBKDF2 vault encryption (production-compatible) |
| `packages/safety-engine` | Pre-ship safety scans |
| `packages/promotion` | Promotion gate + lead nurture + channel execution |
| `packages/shared` | Types, plans, growth content, secret leak patterns |

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev          # web :5173 + api :8787
```

Open http://localhost:5173 — sign up, create a project, unlock vault, add encrypted secrets.

## Integration pipeline

```bash
pnpm integrate    # build + test + safety scan + promotion dry-run
pnpm safety:run https://secretlayer.net .
pnpm promote:check https://secretlayer.net 0.3.0           # dry run
pnpm promote:check --execute https://secretlayer.net 0.3.0 # write changelog, marketing, trigger Netlify hook
```

## Stripe billing

| Plan | Price | Secrets | Projects |
|------|-------|---------|----------|
| Free | $0 | 10 | 3 |
| Personal | $4.99/mo | Unlimited | Unlimited |
| Pro | $9.99/mo | Unlimited | Unlimited |

API routes: `GET /billing/plan`, `POST /billing/checkout`, `POST /billing/portal`

**One-command setup** (same Stripe account as [mirrorpathai.com](https://mirrorpathai.com)):

```bash
Stripe=sk_live_... WEB_ORIGIN=https://secretlayer.net API_ORIGIN=https://api.secretlayer.net pnpm stripe:setup
```

Copy `.env.stripe.generated` → Railway. Full walkthrough: [docs/STRIPE_SETUP_WALKTHROUGH.md](docs/STRIPE_SETUP_WALKTHROUGH.md)

## WWH2 guided help

Free on-page guided tours — spotlight highlights, playbooks, post-guide star ratings.

- Web: floating launcher + **Powered by WWH2** badge on landing
- API: `POST /wwh2/feedback`, `GET /wwh2/stats`
- Production store: **Postgres** via `DATABASE_URL` (Railway); local dev falls back to `data/wwh2-feedback.json`

## Promotion leads

- `POST /leads` — waitlist, safety-scanner, vault-demo sources
- Nurture sequences generated in `packages/promotion` when safety clears
- Artifacts written to `promotion-output/` (changelog, social, marketing)

## Deploy

| Surface | Host | Config |
|---------|------|--------|
| Web + API (recommended) | [secretlayer.net](https://secretlayer.net) on **Railway** | `railway.toml` — one service serves web + API + WWH2 |
| Web only (optional) | Netlify | `netlify.toml` — proxies `/api` to `api.secretlayer.net` |
| API only | Railway | `api.secretlayer.net` |

Push to `main` runs CI. See [docs/DEPLOY_LIVE.md](docs/DEPLOY_LIVE.md).

**Railway production env:**

- `JWT_SECRET` — API auth (required)
- `DATABASE_URL` — Postgres for WWH2 feedback
- `WEB_ORIGIN=https://secretlayer.net`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs — see [docs/BILLING.md](docs/BILLING.md)
- `PROMOTION_WEBHOOK_URL` — optional webhook when promotion gate passes

## Docs

- [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md)
- [docs/SAFETY_NETS.md](docs/SAFETY_NETS.md)
- [docs/GROWTH_PLAYBOOK.md](docs/GROWTH_PLAYBOOK.md)
