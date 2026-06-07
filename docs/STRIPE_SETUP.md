# Stripe setup for SecretLayer

This guide fixes the most common billing break: **putting the wrong Stripe value in the wrong place**.

Production runs on:

- **Netlify** — frontend at `https://secretlayer.net`
- **Railway** — API at `https://api.secretlayer.net`

Stripe secrets belong on **Railway only** (the API). They do **not** go in Netlify, GitHub Secrets (unless you deploy the API from GitHub Actions), Cursor MCP config, or committed repo files.

## 1. Rotate compromised keys first

If a secret was pasted into the wrong place (README, GitHub, Netlify, Cursor config, chat, etc.):

1. Open [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys)
2. **Roll** the secret key (`sk_live_...` or `sk_test_...`)
3. Open [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
4. Open your endpoint → **Roll signing secret** (`whsec_...`)
5. Delete the old values everywhere they were pasted

Use **test mode** while fixing (`sk_test_...`, `whsec_...` from a test webhook).

## 2. Know which key is which

| Value | Looks like | Where it goes |
|-------|------------|---------------|
| Secret API key | `sk_test_...` or `sk_live_...` | Railway → `STRIPE_SECRET_KEY` |
| Webhook signing secret | `whsec_...` | Railway → `STRIPE_WEBHOOK_SECRET` |
| Personal plan price ID | `price_...` | Railway → `STRIPE_PRICE_ID_PERSONAL` |
| Pro plan price ID | `price_...` | Railway → `STRIPE_PRICE_ID_PRO` |
| Publishable key | `pk_test_...` or `pk_live_...` | **Not needed** for hosted Checkout redirect |

### Common mistakes

| Wrong | Right |
|-------|-------|
| `whsec_...` in `STRIPE_SECRET_KEY` | `whsec_...` → `STRIPE_WEBHOOK_SECRET` |
| `pk_live_...` in `STRIPE_SECRET_KEY` | `pk_...` is publishable; use `sk_...` for the secret key |
| Stripe keys in Netlify env vars | Stripe keys on **Railway** (API server) |
| Stripe keys in `~/.cursor/mcp.json` | MCP config is for Cursor tools, not your app |
| Stripe keys in `.env.example` | Real values only in `.env` (local) or Railway (prod) |

## 3. Create products and prices in Stripe

In [Stripe Dashboard → Products](https://dashboard.stripe.com/products), create:

| Plan | Price | Env var |
|------|-------|---------|
| Personal | $4.99/mo recurring | `STRIPE_PRICE_ID_PERSONAL` |
| Pro | $9.99/mo recurring | `STRIPE_PRICE_ID_PRO` |

Copy each **Price ID** (`price_...`), not the Product ID (`prod_...`).

## 4. Configure the webhook on Railway

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://api.secretlayer.net/webhooks/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** (`whsec_...`) → Railway `STRIPE_WEBHOOK_SECRET`

## 5. Set Railway environment variables

In your Railway API service:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PERSONAL=price_...
STRIPE_PRICE_ID_PRO=price_...
WEB_ORIGIN=https://secretlayer.net
JWT_SECRET=<your-long-random-string>
```

Redeploy the API after saving.

## 6. Local development

```bash
cp .env.example .env
# fill in sk_test_..., whsec_... from test mode, and test price IDs
pnpm install
pnpm dev
```

Check: `curl http://localhost:8787/health` should show `"billingConfigured": true`.

## 7. Verify production

1. Log in at `https://secretlayer.net`
2. Click **Upgrade** → should redirect to Stripe Checkout
3. After test payment, plan status should update via webhook
4. **Manage billing** should open the Stripe customer portal

If checkout says "Billing is not available", the API is missing `POST /billing/checkout` or Stripe env vars on Railway.

## API routes (must exist on production API)

| Route | Purpose |
|-------|---------|
| `GET /billing/plan` | Current plan + limits |
| `POST /billing/checkout` | Body: `{ "plan": "personal" \| "pro" }` → `{ "url": "..." }` |
| `POST /billing/portal` | Returns Stripe portal URL |
| `POST /webhooks/stripe` | Stripe webhook receiver |

Deploy the `cursor/stripe-billing-setup-5604` branch (or merge its PR) to Railway to restore the missing checkout/portal routes.
