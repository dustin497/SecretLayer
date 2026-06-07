# Stripe Billing

SecretLayer billing matches production: **Free**, **Personal** ($4.99/mo), **Pro** ($9.99/mo).

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/billing/plan` | Bearer | Current plan, limits, usage, Stripe customer flag |
| POST | `/billing/checkout` | Bearer | Body `{ "plan": "personal" \| "pro" }` → `{ url }` |
| POST | `/billing/portal` | Bearer | Stripe Customer Portal → `{ url }` |
| POST | `/billing/webhook` | Stripe signature | Subscription lifecycle events |

## Plan limits

| Plan | Secrets | Projects |
|------|---------|----------|
| Free | 10 | 3 |
| Personal | Unlimited | Unlimited |
| Pro | Unlimited | Unlimited |

## Stripe setup

1. Create products/prices in [Stripe Dashboard](https://dashboard.stripe.com/products) for Personal and Pro (monthly).
2. Copy price IDs to `STRIPE_PRICE_PERSONAL` and `STRIPE_PRICE_PRO`.
3. Set `STRIPE_SECRET_KEY` (test or live).
4. Add webhook endpoint `https://api.secretlayer.net/billing/webhook` with events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy signing secret to `STRIPE_WEBHOOK_SECRET`.

## Local webhook testing

```bash
stripe listen --forward-to localhost:8787/billing/webhook
```

Use the CLI webhook secret as `STRIPE_WEBHOOK_SECRET`.

## Railway / Netlify env

Set the same variables on Railway for the API service. `WEB_ORIGIN` must match your Netlify URL for checkout redirects.
