import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function TrustBadge() {
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  useEffect(() => {
    api.safetyStatus().then((s) => {
      setScore(s.score);
      setPassed(s.passed);
    }).catch(() => {});
  }, []);

  if (score === null) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.35rem 0.75rem",
        borderRadius: 999,
        border: "1px solid #334155",
        fontSize: "0.8rem",
        color: passed ? "#6ee7b7" : "#fca5a5",
      }}
    >
      <span>Trust score {score}/100</span>
      <span>{passed ? "✓ Safety cleared" : "⚠ Review needed"}</span>
    </div>
  );
}
