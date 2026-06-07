import { useCallback, useState } from "react";
import type { PromotionLead, SafetyReport } from "@secretlayer/shared";

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
    title: "Promotion gate + leads",
    detail: "After safety clears, changelog, site, social, and email drafts are generated — never blind launches.",
  },
];

interface PromotionPreview {
  approved: boolean;
  reason: string;
  leads?: PromotionLead[];
  headline?: string;
}

export function App() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null);
  const [promotion, setPromotion] = useState<PromotionPreview | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading("health");
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setStatus(data.ok ? `API connected (v${data.version}) — ${data.waitlistCount ?? 0} on waitlist.` : "API unhealthy.");
      if (typeof data.waitlistCount === "number") setWaitlistCount(data.waitlistCount);
    } catch {
      setStatus("Start the API with pnpm dev:api");
    } finally {
      setLoading(null);
    }
  }, []);

  const runSafetyScan = useCallback(async () => {
    setLoading("safety");
    setPromotion(null);
    try {
      const res = await fetch("/api/safety/report?target=https://secretlayer.net");
      const data = await res.json();
      if (data.report) {
        setSafetyReport(data.report);
        setStatus(`Safety: ${data.report.score}/100 — ${data.report.passed ? "cleared" : "blocked"}.`);
      }
    } catch {
      setStatus("Safety scan failed — is the API running?");
    } finally {
      setLoading(null);
    }
  }, []);

  const runPromotionCheck = useCallback(async () => {
    setLoading("promotion");
    try {
      const res = await fetch("/api/promotion/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "https://secretlayer.net", version: "0.2.0" }),
      });
      const data = await res.json();
      if (data.safetyReport) setSafetyReport(data.safetyReport);
      if (data.result) {
        setPromotion({
          approved: data.result.approved,
          reason: data.result.reason,
          leads: data.result.plan?.leads,
          headline: data.result.plan?.headline,
        });
        setStatus(data.result.reason);
      }
    } catch {
      setStatus("Promotion check failed — is the API running?");
    } finally {
      setLoading(null);
    }
  }, []);

  const joinWaitlist = useCallback(async () => {
    if (!email.includes("@")) {
      setStatus("Enter a valid email to join the waitlist.");
      return;
    }
    setLoading("waitlist");
    try {
      const res = await fetch("/api/leads/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "web-hero" }),
      });
      const data = await res.json();
      setStatus(data.message ?? "Thanks — you're on the waitlist.");
      if (typeof data.waitlistCount === "number") setWaitlistCount(data.waitlistCount);
      setEmail("");
    } catch {
      setStatus("Waitlist signup failed — try again shortly.");
    } finally {
      setLoading(null);
    }
  }, [email]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <header style={{ marginBottom: "3rem" }}>
        <p style={{ color: "#67e8f9", letterSpacing: "0.12em", fontSize: "0.75rem", textTransform: "uppercase" }}>
          secretlayer.net · github.com/dustin497/SecretLayer
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0.5rem 0", lineHeight: 1.1 }}>
          Secrets for the common builder
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1.125rem", maxWidth: 640 }}>
          Organize API keys, tokens, and env vars into projects and encrypted vaults. Run safety nets before you ship —
          promote only when the industry bar is met, with channel-ready leads.
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
        <h2 style={{ marginTop: 0 }}>Safety → Promotion integration</h2>
        <p style={{ color: "#cbd5e1", marginTop: 0 }}>
          Run the same safety engine and promotion gate used in CI. When checks pass, preview channel-specific promotion
          leads.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <ActionButton label="Check API" loading={loading === "health"} onClick={checkHealth} />
          <ActionButton label="Run safety scan" loading={loading === "safety"} onClick={runSafetyScan} />
          <ActionButton label="Promotion gate" loading={loading === "promotion"} onClick={runPromotionCheck} primary />
        </div>
        {status && <p style={{ margin: "0.5rem 0", color: "#a5f3fc" }}>{status}</p>}
        {safetyReport && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 8,
              fontSize: "0.9rem",
            }}
          >
            <strong style={{ color: safetyReport.passed ? "#6ee7b7" : "#fca5a5" }}>
              Score {safetyReport.score}/100 — {safetyReport.passed ? "PASSED" : "BLOCKED"}
            </strong>
            <ul style={{ color: "#cbd5e1", margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
              {safetyReport.findings.slice(0, 5).map((f, i) => (
                <li key={i}>
                  {f.passed ? "✓" : "✗"} {f.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        {promotion?.leads && promotion.leads.length > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
              {promotion.headline ?? "Promotion leads"}
            </h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {promotion.leads.slice(0, 3).map((lead) => (
                <details
                  key={lead.channel}
                  style={{
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                  }}
                >
                  <summary style={{ cursor: "pointer", color: "#e2e8f0" }}>
                    [{lead.channel}] {lead.title}
                  </summary>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      color: "#94a3b8",
                      fontSize: "0.8rem",
                      margin: "0.75rem 0 0",
                    }}
                  >
                    {lead.content}
                  </pre>
                  {lead.cta && <p style={{ color: "#67e8f9", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>{lead.cta}</p>}
                </details>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer style={{ color: "#64748b", fontSize: "0.875rem" }}>
        <label htmlFor="waitlist" style={{ display: "block", marginBottom: "0.5rem" }}>
          Get notified when the upgraded vault ships
          {waitlistCount !== null && ` · ${waitlistCount} builder${waitlistCount === 1 ? "" : "s"} waiting`}
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
            onClick={joinWaitlist}
            disabled={loading === "waitlist"}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: "#e2e8f0",
              cursor: loading === "waitlist" ? "wait" : "pointer",
            }}
          >
            {loading === "waitlist" ? "Joining…" : "Join waitlist"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  loading,
  primary,
}: {
  label: string;
  onClick: () => void;
  loading?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        background: primary ? "#06b6d4" : "transparent",
        color: primary ? "#0b1220" : "#e2e8f0",
        border: primary ? "none" : "1px solid #334155",
        borderRadius: 8,
        padding: "0.65rem 1.25rem",
        fontWeight: 600,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Running…" : label}
    </button>
  );
}
