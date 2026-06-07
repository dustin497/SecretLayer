# SecretLayer

**[secretlayer.net](https://secretlayer.net)** — vault-first secrets for builders. Projects, encrypted vaults, safety nets, and promotion gates that only fire after checks pass.

## Stack

| Package | Purpose |
|---------|---------|
| `apps/web` | React app — landing, auth, vault dashboard, safety scanner |
| `apps/api` | Express API — auth, projects, vault-items, leads, analytics |
| `packages/crypto` | AES-GCM + PBKDF2 vault encryption (production-compatible) |
| `packages/safety-engine` | Pre-ship safety scans |
| `packages/promotion` | Promotion gate + lead nurture + channel execution |
| `packages/shared` | Types and secret leak patterns |

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

```bash
# API routes: GET /billing/plan, POST /billing/checkout, POST /billing/portal
# See docs/BILLING.md for Stripe Dashboard setup
```

Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PERSONAL`, `STRIPE_PRICE_PRO`, and `STRIPE_WEBHOOK_SECRET` on Railway.

## Promotion leads

- `POST /leads` — waitlist, safety-scanner, vault-demo sources
- Nurture sequences generated in `packages/promotion` when safety clears
- Artifacts written to `promotion-output/` (changelog, social, marketing)

## Deploy

- **Web:** Netlify (`apps/web/netlify.toml`) — proxies `/api` to production API
- **API:** Railway (`api.secretlayer.net`)

## Docs

- [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md)
- [docs/SAFETY_NETS.md](docs/SAFETY_NETS.md)
