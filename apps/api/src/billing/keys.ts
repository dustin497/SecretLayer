/** Resolve Stripe secret from Cursor secrets / Railway. */
export function resolveStripeSecretKey(): string | undefined {
  return (
    process.env.STRIPE_SECRET_KEY ||
    process.env.stripe ||
    process.env.STRIPE ||
    process.env.BRAND_AGENT_STRIPE_KEY ||
    process.env.BRAND_AGENTS_STRIPE_KEY ||
    process.env.BRAND_AGENT_STRIPE_SECRET_KEY
  );
}
