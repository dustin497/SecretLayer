import type { Playbook } from "./types";

export const WWH2_PLAYBOOKS: Playbook[] = [
  {
    id: "create-first-vault",
    title: "Create your first encrypted vault",
    description: "Set a master password and unlock your local vault in minutes.",
    audience: "New builders",
    estimatedMinutes: 3,
    steps: [
      {
        target: "vault-setup",
        title: "Start here",
        message: "This is the vault setup panel. SecretLayer encrypts everything in your browser before it is stored.",
      },
      {
        target: "master-password",
        title: "Choose a master password",
        message:
          "Enter a strong master password you will remember. SecretLayer cannot recover it — this is what keeps your vault zero-knowledge.",
      },
      {
        target: "confirm-password",
        title: "Confirm your password",
        message: "Type the same password again so you know the vault will unlock correctly later.",
      },
      {
        target: "create-vault-btn",
        title: "Create the vault",
        message: "Click Create vault. Your encrypted vault is created on this device — no plaintext secrets leave the browser.",
      },
    ],
  },
  {
    id: "cloud-sync-account",
    title: "Set up cloud sync account",
    description: "Create an account so your encrypted vault can sync between devices.",
    audience: "Builders using multiple devices",
    estimatedMinutes: 4,
    steps: [
      {
        target: "account-section",
        title: "Open account setup",
        message: "The Account section lets you create a login for encrypted cloud sync. Secrets stay encrypted — the server only stores ciphertext.",
      },
      {
        target: "create-account-btn",
        title: "Create your account",
        message: "Click Create account to register. Use an email you check — it is only for sign-in, not for reading your secrets.",
      },
      {
        target: "sign-in-toggle",
        title: "Already have an account?",
        message: "If you registered before, use Sign in instead to unlock sync on this device.",
      },
      {
        target: "vault-setup",
        title: "Unlock with master password",
        message: "After signing in, unlock the vault with your master password on each device. Sync moves encrypted envelopes only.",
      },
    ],
  },
  {
    id: "import-backup",
    title: "Import a vault backup",
    description: "Restore an encrypted backup file from another device or export.",
    audience: "Builders migrating devices",
    estimatedMinutes: 2,
    steps: [
      {
        target: "import-backup-btn",
        title: "Find Import backup",
        message: "Click Import backup to select your encrypted vault export file (.json).",
      },
      {
        target: "master-password",
        title: "Enter master password",
        message: "Use the same master password from when the backup was created. SecretLayer decrypts locally in your browser.",
      },
      {
        target: "vault-setup",
        title: "Verify vault loaded",
        message: "After import, your projects and secrets appear in the product view once decryption succeeds.",
      },
    ],
  },
  {
    id: "choose-your-plan",
    title: "Choose the right plan",
    description: "Compare Free, Personal, and Pro limits before you upgrade.",
    audience: "Founders comparing plans",
    estimatedMinutes: 3,
    steps: [
      {
        target: "pricing-section",
        title: "Pricing overview",
        message: "All plans start with local encryption. Paid plans add unlimited secrets, projects, and encrypted cloud sync.",
      },
      {
        target: "plan-free",
        title: "Free — get organized",
        message: "Free includes 10 secrets and 3 projects with local backup/import. Great for solo builders getting started.",
      },
      {
        target: "plan-personal",
        title: "Personal — move between devices",
        message: "Personal ($4.99/mo) removes limits and adds encrypted cloud sync for founders working across machines.",
      },
      {
        target: "plan-pro",
        title: "Pro — agencies & client work",
        message: "Pro ($9.99/mo) adds Hadassah Pro reviews and developer protection workflows for heavier builder workloads.",
      },
    ],
  },
  {
    id: "leave-a-review",
    title: "Leave a review & rating",
    description: "Share what feels secure, clear, and worth paying for.",
    audience: "Early adopters & developers",
    estimatedMinutes: 4,
    steps: [
      {
        target: "reviews-section",
        title: "Reviews section",
        message: "Scroll to Reviews & ratings. Your feedback helps other builders trust the vault before they store keys.",
      },
      {
        target: "rate-vault-clarity",
        title: "Rate vault clarity",
        message: "Score how clearly SecretLayer explains encryption, local unlock, and backup behavior.",
      },
      {
        target: "rate-builder-workflow",
        title: "Rate builder workflow",
        message: "Score how well the vault fits API keys, provider links, billing pages, and recovery notes.",
      },
      {
        target: "review-form",
        title: "Submit your review",
        message:
          "Add your display name, role, and review text. Never include API keys or secrets — the safety check screens submissions first.",
      },
      {
        target: "submit-review-btn",
        title: "Submit",
        message: "Click Submit review. Screened reviews may appear publicly to help other developers decide.",
      },
    ],
  },
];

export function getPlaybookById(id: string): Playbook | undefined {
  return WWH2_PLAYBOOKS.find((p) => p.id === id);
}
