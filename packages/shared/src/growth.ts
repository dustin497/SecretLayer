export interface ApiLanding {
  slug: string;
  name: string;
  tagline: string;
  problem: string;
  secrets: string[];
  searchTerms: string[];
  vaultExample: { project: string; vault: string; keys: string[] };
  cta: string;
}

export const API_LANDINGS: ApiLanding[] = [
  {
    slug: "openai",
    name: "OpenAI",
    tagline: "Stop losing GPT API keys across .env files and chat threads",
    problem: "Builders leak OPENAI_API_KEY in repos, share keys in Slack, and burn budget on orphaned tokens.",
    secrets: ["OPENAI_API_KEY", "OPENAI_ORG_ID", "AZURE_OPENAI_KEY"],
    searchTerms: ["openai api key management", "store openai key safely", "openai env variables"],
    vaultExample: { project: "AI SaaS", vault: "Production", keys: ["OPENAI_API_KEY", "OPENAI_ORG_ID"] },
    cta: "Organize OpenAI keys in encrypted vaults",
  },
  {
    slug: "supabase",
    name: "Supabase",
    tagline: "One vault for anon keys, service roles, and DB URLs",
    problem: "Supabase service_role keys in frontend bundles are a top leak. Anon vs service keys get mixed in one .env.",
    secrets: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"],
    searchTerms: ["supabase service role key security", "supabase env management"],
    vaultExample: { project: "Mobile App", vault: "Supabase Prod", keys: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] },
    cta: "Vault Supabase credentials by environment",
  },
  {
    slug: "stripe",
    name: "Stripe",
    tagline: "Live vs test keys — never commingled again",
    problem: "sk_live_ in a test branch or sk_test_ in production breaks payments and compliance.",
    secrets: ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
    searchTerms: ["stripe api key storage", "stripe webhook secret management"],
    vaultExample: { project: "D Most Services", vault: "Stripe Live", keys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
    cta: "Separate Stripe live and test vaults",
  },
  {
    slug: "github",
    name: "GitHub",
    tagline: "PATs, fine-grained tokens, and Actions secrets — organized",
    problem: "ghp_ tokens in git history are irreversible. Teams rotate keys without a single source of truth.",
    secrets: ["GITHUB_TOKEN", "GH_PAT", "NPM_TOKEN"],
    searchTerms: ["github personal access token storage", "github actions secrets best practices"],
    vaultExample: { project: "Open Source", vault: "CI", keys: ["GITHUB_TOKEN", "NPM_TOKEN"] },
    cta: "Store GitHub tokens outside your repo",
  },
  {
    slug: "vercel",
    name: "Vercel",
    tagline: "Sync mental model: local vault → Vercel env",
    problem: "Env vars drift between Vercel projects, preview, and production with no builder-side backup.",
    secrets: ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"],
    searchTerms: ["vercel environment variables backup", "vercel api token management"],
    vaultExample: { project: "Marketing Site", vault: "Vercel Prod", keys: ["VERCEL_TOKEN", "OPENAI_API_KEY"] },
    cta: "Master list for Vercel-bound secrets",
  },
  {
    slug: "aws",
    name: "AWS",
    tagline: "Access keys belong in vaults — not in ~/.aws/credentials chaos",
    problem: "AKIA keys in code scanners fire daily. Multiple clients mean multiple IAM keys with no project scoping.",
    secrets: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "AWS_SESSION_TOKEN"],
    searchTerms: ["aws access key management indie", "store aws credentials securely"],
    vaultExample: { project: "Client ACME", vault: "AWS Prod", keys: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"] },
    cta: "Per-client AWS vaults for freelancers",
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    tagline: "Claude API keys with the same rigor as production DB passwords",
    problem: "Teams adopting Claude alongside OpenAI double their key sprawl overnight.",
    secrets: ["ANTHROPIC_API_KEY"],
    searchTerms: ["anthropic api key storage", "claude api env variables"],
    vaultExample: { project: "AI Agent", vault: "LLM Providers", keys: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] },
    cta: "Vault Anthropic keys by project",
  },
  {
    slug: "twilio",
    name: "Twilio",
    tagline: "Account SID, auth token, and messaging — one vault per app",
    problem: "SMS/voice credentials reused across staging and prod cause surprise bills.",
    secrets: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_API_KEY"],
    searchTerms: ["twilio credentials management", "twilio env variables"],
    vaultExample: { project: "Notifications", vault: "Twilio", keys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"] },
    cta: "Isolate Twilio secrets per environment",
  },
  {
    slug: "resend",
    name: "Resend",
    tagline: "Email API keys without the sendgrid-env-file mess",
    problem: "Transactional email keys sit beside marketing tools in one bloated .env.",
    secrets: ["RESEND_API_KEY"],
    searchTerms: ["resend api key storage", "email api key management"],
    vaultExample: { project: "SaaS", vault: "Email", keys: ["RESEND_API_KEY"] },
    cta: "Dedicated email API vault",
  },
  {
    slug: "firebase",
    name: "Firebase",
    tagline: "Service accounts and config JSON — encrypted, not emailed",
    problem: "firebase-adminsdk JSON files in Downloads folders get committed or shared in zip files.",
    secrets: ["FIREBASE_API_KEY", "FIREBASE_PROJECT_ID", "GOOGLE_APPLICATION_CREDENTIALS"],
    searchTerms: ["firebase service account storage", "firebase admin sdk secrets"],
    vaultExample: { project: "Mobile", vault: "Firebase", keys: ["FIREBASE_PROJECT_ID", "FIREBASE_API_KEY"] },
    cta: "Vault Firebase admin credentials",
  },
];

export function getLandingBySlug(slug: string): ApiLanding | undefined {
  return API_LANDINGS.find((l) => l.slug === slug);
}

export const REFERRAL_GOAL = 5;
export const REFERRAL_REWARD_DAYS = 30;
