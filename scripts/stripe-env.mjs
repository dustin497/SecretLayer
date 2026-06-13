/** Match Cursor / Railway Stripe secret env names (any casing for "stripe"). */
const EXPLICIT_NAMES = [
  "STRIPE_SECRET_KEY",
  "Stripe",
  "stripe",
  "STRIPE",
  "BRAND_AGENT_STRIPE_KEY",
  "BRAND_AGENTS_STRIPE_KEY",
  "BRAND_AGENT_STRIPE_SECRET_KEY",
];

export function resolveStripeSecretKey() {
  for (const name of EXPLICIT_NAMES) {
    const value = process.env[name];
    if (value) return value;
  }
  for (const [name, value] of Object.entries(process.env)) {
    if (name.toLowerCase() === "stripe" && value) return value;
  }
  return undefined;
}
