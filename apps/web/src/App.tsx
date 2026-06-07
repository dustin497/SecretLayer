import { useState } from "react";

const features = [
  {
    title: "Projects → Vaults",
    detail: "Group secrets by app, client, or environment. Each vault encrypts before it touches disk or sync.",
  },
  {
    title: "Safety nets first",
    detail: "Industry-calibrated scans for leaked keys, weak headers, and auth gaps — nothing ships until checks pass.",
  },
  {
    title: "Promotion gate",
    detail: "After safety clears, automated changelog, site, and social promotion plans are generated — never blind launches.",
  },
];

export function App() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setStatus(data.ok ? "API connected — ready for vault sync." : "API unhealthy.");
    } catch {
      setStatus("Start the API with pnpm dev:api");
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <header style={{ marginBottom: "3rem" }}>
        <p style={{ color: "#67e8f9", letterSpacing: "0.12em", fontSize: "0.75rem", textTransform: "uppercase" }}>
          secretlayer.net
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0", lineHeight: 1.1 }}>
          Secrets for the common builder
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.125rem", maxWidth: 640 }}>
          Organize API keys, tokens, and env vars into projects and encrypted vaults. Run safety nets before you ship —
          promote only when the industry bar is met.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          marginBottom: "2.5rem",
        }}
      >
        {features.map((f) => (
          <article
            key={f.title}
            style={{
              background: "#111827",
              border: "1px solid #1e293b",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>{f.title}</h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.95rem" }}>{f.detail}</p>
          </article>
        ))}
      </section>

      <section
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #164e63 100%)",
          borderRadius: 16,
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Next-level calibration</h2>
        <ul style={{ color: "#cbd5e1", lineHeight: 1.7, paddingLeft: "1.25rem" }}>
          <li>Zero-knowledge vault encryption (client-side before sync)</li>
          <li>Secret leak patterns: AWS, GitHub, Stripe, DB URLs, JWTs</li>
          <li>CSP / HSTS / frame protections benchmarked to production</li>
          <li>Promotion blocked until safety score ≥ 80 with zero critical findings</li>
        </ul>
        <button
          type="button"
          onClick={checkHealth}
          style={{
            marginTop: "0.5rem",
            background: "#06b6d4",
            color: "#0b1220",
            border: "none",
            borderRadius: 8,
            padding: "0.65rem 1.25rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Check local API
        </button>
        {status && <p style={{ marginTop: "0.75rem", color: "#a5f3fc" }}>{status}</p>}
      </section>

      <footer style={{ color: "#64748b", fontSize: "0.875rem" }}>
        <label htmlFor="waitlist" style={{ display: "block", marginBottom: "0.5rem" }}>
          Get notified when the upgraded vault ships
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            id="waitlist"
            type="email"
            placeholder="you@builds.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "0.6rem 0.75rem",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#0f172a",
              color: "#e2e8f0",
            }}
          />
          <button
            type="button"
            onClick={() => setStatus("Thanks — waitlist hookup coming in v0.3.")}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: "#e2e8f0",
              cursor: "pointer",
            }}
          >
            Join waitlist
          </button>
        </div>
      </footer>
    </div>
  );
}
