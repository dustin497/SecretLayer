import { SECRET_PATTERNS } from "@secretlayer/shared";

export interface ScanHit {
  label: string;
  severity: "warn" | "critical";
  excerpt: string;
}

export function scanTextForSecrets(text: string): ScanHit[] {
  const hits: ScanHit[] = [];
  for (const { label, pattern, severity } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      hits.push({
        label,
        severity,
        excerpt: match[0].slice(0, 24) + (match[0].length > 24 ? "…" : ""),
      });
    }
  }
  return hits;
}

export function scanPasses(hits: ScanHit[]): boolean {
  return !hits.some((h) => h.severity === "critical");
}
