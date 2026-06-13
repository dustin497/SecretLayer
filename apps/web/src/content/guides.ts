export interface Guide {
  slug: string;
  week: number;
  title: string;
  summary: string;
  readMinutes: number;
  publishedAt: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "openai-api-key-vault-week-1",
    week: 1,
    title: "The builder's guide to OpenAI API keys (without leaking them)",
    summary: "Where keys leak, how to structure vaults per environment, and a 15-minute setup checklist.",
    readMinutes: 12,
    publishedAt: "2026-06-07",
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
