# Stripe setup — same account as Mirror Path AI

Mirror Path AI (`mirrorpathai.com`) already uses your Stripe account with this Payment Link:

**https://buy.stripe.com/bJebJ1dTlfnvdCn4aZbV600** ($1 commitment)

SecretLayer should use the **same Stripe login** — not a new account.

---

## Step 1 — Bank & payouts (one time)

If you already accept payments on Mirror Path, this may be done.

1. Open **https://dashboard.stripe.com/settings/payouts**
2. Add or confirm your **bank account** for deposits
3. If Stripe asks you to finish activation: **https://dashboard.stripe.com/account/onboarding**

This is where you enter bank information for **receiving** money (not paying).

---

## Step 2 — Automatic setup (recommended)

1. Get your secret key: **https://dashboard.stripe.com/apikeys**  
   - Start with **Test mode** (toggle top-right) → `sk_test_...`
2. From the repo root:

**Cursor Cloud:** save your key as a secret named `stripe` (or `STRIPE_SECRET_KEY`), then start a new agent and run:

```bash
pnpm stripe:setup
```

**Local shell** (paste key inline):

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxx pnpm stripe:setup
```

This creates:

- SecretLayer Personal ($4.99/mo) + Pro ($9.99/mo) products
- Price IDs + Payment Links (Mirror Path style `buy.stripe.com/...`)
- Webhook pointing at `https://api.secretlayer.net/billing/webhook`
- File `.env.stripe.generated` with all variables

3. Copy values from `.env.stripe.generated` into **Railway** (API service env vars).

---

## Step 3 — Manual Payment Links (no script)

Same flow as Mirror Path’s `$1` link:

1. **https://dashboard.stripe.com/payment-links** → **+ New**
2. Product: recurring **$4.99/month** → name “SecretLayer Personal”
3. After payment → redirect to `https://secretlayer.net/app?billing=success`
4. Copy link → `STRIPE_PAYMENT_LINK_PERSONAL`
5. Repeat for **$9.99/month** Pro → `STRIPE_PAYMENT_LINK_PRO`
6. Still add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` on Railway for plan upgrades via webhook

---

## Step 4 — Railway environment

Set on `api.secretlayer.net`:

| Variable | Source |
|----------|--------|
| `STRIPE_SECRET_KEY` | Dashboard → API keys |
| `STRIPE_WEBHOOK_SECRET` | Dashboard → Webhooks → signing secret |
| `STRIPE_PRICE_PERSONAL` | From `pnpm stripe:setup` |
| `STRIPE_PRICE_PRO` | From `pnpm stripe:setup` |
| `STRIPE_PAYMENT_LINK_PERSONAL` | From setup or Payment Links page |
| `STRIPE_PAYMENT_LINK_PRO` | From setup or Payment Links page |
| `WEB_ORIGIN` | `https://secretlayer.net` |

---

## Step 5 — Test checkout (customer pays you)

1. Sign up at **https://secretlayer.net** (or local `pnpm dev`)
2. Open **Vault dashboard** → **Billing** → **Upgrade to Personal**
3. You’ll land on Stripe Checkout (same experience as Mirror Path “Pay $1”)
4. Test card: `4242 4242 4242 4242`, any future date, any CVC

---

## Verify

```bash
curl -s https://api.secretlayer.net/billing/config | jq
```

`configured` should be `true` after env vars are set on Railway.
