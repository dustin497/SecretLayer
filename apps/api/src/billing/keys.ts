/** Resolve Stripe secret from Cursor secrets / Railway (name: Stripe, stripe, STRIPE_SECRET_KEY, …). */
export function resolveStripeSecretKey(): string | undefined {
  const explicit = [
    process.env.STRIPE_SECRET_KEY,
    process.env.Stripe,
    process.env.stripe,
    process.env.STRIPE,
    process.env.BRAND_AGENT_STRIPE_KEY,
    process.env.BRAND_AGENTS_STRIPE_KEY,
    process.env.BRAND_AGENT_STRIPE_SECRET_KEY,
  ].find(Boolean);
  if (explicit) return explicit;

  for (const [name, value] of Object.entries(process.env)) {
    if (name.toLowerCase() === "stripe" && value) return value;
  }
  return undefined;
}
